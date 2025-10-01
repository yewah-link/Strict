import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],  // ✅ Add RouterLink
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {

}
