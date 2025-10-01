import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// Import the actual components
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, Navbar, Footer],
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.scss']
})
export class Homepage{
  constructor(private router: Router) {}

  loginAs(role: 'STUDENT' | 'EXAMINER') {
    if (role === 'STUDENT') {
      this.router.navigate(['/login'], { queryParams: { role: 'STUDENT' } });
    } else if (role === 'EXAMINER') {
      this.router.navigate(['/login'], { queryParams: { role: 'EXAMINER' } });
    }
  }
}
