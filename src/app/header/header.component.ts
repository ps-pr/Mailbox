import { Component, Input, OnInit } from '@angular/core';
import { SideNavService } from '../services/sidenav-service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { AngularFireDatabase } from '@angular/fire/database';
import { HostListener } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '../snackbar/snackbar.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  loginSuccess: boolean = false;
  loggedInUser;
  unReadCount: number = 0;
  @Input() public title: string;
  @Input() public isUserLoggedIn: boolean;
  constructor(
    private sideNavService: SideNavService,
    private auth: AuthService,
    private router: Router,
    private db: AngularFireDatabase,
    private snackBar: MatSnackBar
  ) {}
  ngOnInit(): void {
    this.getUser();
  }

  clickMenu() {
    this.sideNavService.toggle();
  }

  signOut() {
    this.auth.signOut();
    this.loginSuccess = false;
    this.router.navigateByUrl('/');
    this.openSnackBar('Signout Successfully', 'snackbar-success');
  }

  getUser() {
    this.auth.getUser().subscribe(
      (user) => {
        if (user) {
          this.loginSuccess = true;

          this.db
            .object(`/users/${user.uid}`)
            .valueChanges()
            .subscribe((userObj) => {
              let inbox = userObj['inbox'];
              this.notificationBadge(inbox);
            });
        } else {
          this.loginSuccess = false;
          this.router.navigateByUrl('/');
        }
      },
      (error) => {
        console.log(error);
        this.loginSuccess = false;
      }
    );
  }

  notificationBadge(inbox) {
    let count = 0;
    inbox.forEach((element) => {
      if (element.read === false) {
        count += 1;
        this.unReadCount = count;
      } else {
        this.unReadCount = 0;
      }
    });
    // this.unReadCount = 0;
  }

  openSnackBar(message: string, h: string) {
    this.snackBar.openFromComponent(SnackbarComponent, {
      panelClass: [h],
      horizontalPosition: 'center',
      verticalPosition: 'top',
      duration: 1500,
      data: message,
    });
  }
}
