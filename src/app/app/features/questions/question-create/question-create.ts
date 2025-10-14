import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { QuestionService, QuestionDto, ResponseStatusEnum } from '../../../core/services/question.service';

@Component({
  selector: 'app-question-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './question-create.html',
  styleUrl: './question-create.scss'
})
export class QuestionCreate implements OnInit {
  questionData: QuestionDto = {
    text: '',
    type: 'MULTIPLE_CHOICE',
    marks: 1,
    choices: []
  };

  examId!: number;
  questionId?: number;
  isEditMode = false;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  questionCount = 1;
  showSuccessModal = false;

  // These values MUST match your QuestionType enum exactly
  questionTypes = [
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
    { value: 'TRUE_FALSE', label: 'True/False' },
    { value: 'WRITTEN', label: 'Written' },
    { value: 'ESSAY', label: 'Essay' }
  ];

  constructor(
    private questionService: QuestionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.examId = +params['examId'];

      if (params['questionId']) {
        this.isEditMode = true;
        this.questionId = +params['questionId'];
        this.loadQuestionData();
      } else {
        // Load question count for new questions
        this.loadQuestionCount();
        // Initialize with default choices for multiple choice
        this.addChoice();
        this.addChoice();
      }
    });
  }

  loadQuestionCount(): void {
    this.questionService.getQuestionsByExam(this.examId).subscribe({
      next: (response) => {
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          // Set question count to the next question number
          this.questionCount = response._embedded.length + 1;
        } else {
          // Default to 1 if no questions exist
          this.questionCount = 1;
        }
      },
      error: (error) => {
        console.error('Failed to load question count:', error);
        // Default to 1 on error
        this.questionCount = 1;
      }
    });
  }

  loadQuestionData(): void {
    if (!this.questionId) return;

    this.isLoading = true;
    this.questionService.getQuestionById(this.questionId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === ResponseStatusEnum.SUCCESS && response._embedded) {
          this.questionData = response._embedded;
          // Ensure choices array exists
          if (!this.questionData.choices) {
            this.questionData.choices = [];
          }
        } else {
          this.errorMessage = response.message || 'Failed to load question';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to load question';
      }
    });
  }

  onQuestionTypeChange(): void {
    // Reset choices when type changes
    if (this.questionData.type === 'TRUE_FALSE') {
      this.questionData.choices = [
        { choiceText: 'True', isCorrect: false },
        { choiceText: 'False', isCorrect: false }
      ];
    } else if (this.questionData.type === 'MULTIPLE_CHOICE') {
      // Only reset if no choices exist
      if (!this.questionData.choices || this.questionData.choices.length === 0) {
        this.questionData.choices = [
          { choiceText: '', isCorrect: false },
          { choiceText: '', isCorrect: false }
        ];
      }
    } else {
      // For WRITTEN and ESSAY, no choices needed
      this.questionData.choices = [];
    }
  }

  addChoice(): void {
    if (!this.questionData.choices) {
      this.questionData.choices = [];
    }
    this.questionData.choices.push({ choiceText: '', isCorrect: false });
  }

  removeChoice(index: number): void {
    if (this.questionData.choices && this.questionData.choices.length > 2) {
      this.questionData.choices.splice(index, 1);
    }
  }

  onCorrectChoiceChange(index: number): void {
    // For multiple choice and true/false, only one answer can be correct
    if (this.questionData.choices) {
      this.questionData.choices.forEach((choice, i) => {
        choice.isCorrect = i === index;
      });
    }
  }

  showChoices(): boolean {
    return this.questionData.type === 'MULTIPLE_CHOICE' || this.questionData.type === 'TRUE_FALSE';
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    // Validation
    if (!this.questionData.text.trim()) {
      this.errorMessage = 'Question text is required';
      return;
    }

    if (this.showChoices()) {
      const hasCorrectAnswer = this.questionData.choices?.some(c => c.isCorrect);
      if (!hasCorrectAnswer) {
        this.errorMessage = 'Please select the correct answer';
        return;
      }

      const allChoicesFilled = this.questionData.choices?.every(c => {
        return c.choiceText && c.choiceText.trim().length > 0;
      });

      if (!allChoicesFilled) {
        this.errorMessage = 'All choices must be filled';
        return;
      }
    }

    this.isLoading = true;

    // Clean up the data before sending
    const questionToSend: QuestionDto = {
      text: this.questionData.text,
      type: this.questionData.type,
      marks: this.questionData.marks,
      choices: this.showChoices() ? this.questionData.choices : []
    };

    const request = this.isEditMode && this.questionId
      ? this.questionService.updateQuestion(this.questionId, questionToSend)
      : this.questionService.addQuestion(this.examId, questionToSend);

    request.subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === ResponseStatusEnum.SUCCESS) {
          this.successMessage = this.isEditMode
            ? 'Question updated successfully!'
            : 'Question created successfully!';

          // Show modal only when creating (not editing)
          if (!this.isEditMode) {
            setTimeout(() => {
              this.showSuccessModal = true;
            }, 500);
          } else {
            setTimeout(() => {
              this.goBackToExam();
            }, 1500);
          }
        } else {
          this.errorMessage = response.message || 'Failed to save question';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || error.message || 'Failed to save question';
      }
    });
  }

  onAddAnotherQuestion(): void {
    this.showSuccessModal = false;
    this.addAnotherQuestion();
  }

  onFinishAdding(): void {
    this.showSuccessModal = false;
    this.goBackToExam();
  }

  addAnotherQuestion(): void {
    // Increment question count for the next question
    this.questionCount++;

    // Reset the form to initial state
    this.questionData = {
      text: '',
      type: 'MULTIPLE_CHOICE',
      marks: 1,
      choices: [
        { choiceText: '', isCorrect: false },
        { choiceText: '', isCorrect: false }
      ]
    };

    // Clear messages - don't show success message
    this.errorMessage = '';
    this.successMessage = '';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goBackToExam(): void {
    this.router.navigate(['/exams', this.examId]);
  }

  onCancel(): void {
    this.goBackToExam();
  }
}