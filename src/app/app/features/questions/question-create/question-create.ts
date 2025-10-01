import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { QuestionService, QuestionDto, ResponseStatusEnum, ChoicesDto } from '../../../core/services/question.service';

@Component({
  selector: 'app-question-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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

  questionTypes = [
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
    { value: 'TRUE_FALSE', label: 'True/False' },
    { value: 'SHORT_ANSWER', label: 'Short Answer' },
    { value: 'ESSAY', label: 'Essay' }
  ];

  constructor(
    private questionService: QuestionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.examId = +params['examId'];

      if (params['questionId']) {
        this.isEditMode = true;
        this.questionId = +params['questionId'];
        this.loadQuestionData();
      } else {
        // Initialize with default choices for multiple choice
        this.addChoice();
        this.addChoice();
      }
    });
  }

  loadQuestionData() {
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

  onQuestionTypeChange() {
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
      // For SHORT_ANSWER and ESSAY, no choices needed
      this.questionData.choices = [];
    }
  }

  addChoice() {
    if (!this.questionData.choices) {
      this.questionData.choices = [];
    }
    this.questionData.choices.push({ choiceText: '', isCorrect: false });
  }

  removeChoice(index: number) {
    if (this.questionData.choices && this.questionData.choices.length > 2) {
      this.questionData.choices.splice(index, 1);
    }
  }

  onCorrectChoiceChange(index: number) {
    // For multiple choice, only one answer can be correct
    if (this.questionData.type === 'MULTIPLE_CHOICE' || this.questionData.type === 'TRUE_FALSE') {
      this.questionData.choices?.forEach((choice, i) => {
        choice.isCorrect = i === index;
      });
    }
  }

  showChoices(): boolean {
    return this.questionData.type === 'MULTIPLE_CHOICE' || this.questionData.type === 'TRUE_FALSE';
  }

  onSubmit() {
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

      // Debug: Log choices to see what we have
      console.log('Validating choices:', this.questionData.choices);

      const allChoicesFilled = this.questionData.choices?.every(c => {
        const isFilled = c.choiceText && c.choiceText.trim().length > 0;
        console.log(`Choice "${c.choiceText}" is filled: ${isFilled}`);
        return isFilled;
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

    // Debug: Log what we're sending
    console.log('Sending question data:', questionToSend);

    const request = this.isEditMode && this.questionId
      ? this.questionService.updateQuestion(this.questionId, questionToSend)
      : this.questionService.addQuestion(this.examId, questionToSend);

    request.subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Response:', response);
        if (response.status === ResponseStatusEnum.SUCCESS) {
          this.successMessage = this.isEditMode
            ? 'Question updated successfully!'
            : 'Question created successfully!';
          setTimeout(() => {
            this.router.navigate(['/exams', this.examId]);
          }, 1500);
        } else {
          this.errorMessage = response.message || 'Failed to save question';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error details:', error);
        this.errorMessage = error.error?.message || error.message || 'Failed to save question';
      }
    });
  }

  onCancel() {
    this.router.navigate(['/exams', this.examId]);
  }

  getChoiceLetter(index: number): string {
    return String.fromCharCode(65 + index); // 65 is ASCII for 'A'
  }
}
