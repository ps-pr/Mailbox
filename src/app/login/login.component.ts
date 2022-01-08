import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { matchValidator } from '../services/form-validators';
import { AuthService } from '../services/auth.service';
import { finalize } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFireDatabase } from '@angular/fire/database';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RandomuserService } from '../services/randomuser.service';
import { transition, style, animate, trigger } from '@angular/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '../snackbar/snackbar.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  animations: [
    trigger('fade', [
      transition('void => *', [
        style({ opacity: 0 }),
        animate(1500, style({ opacity: 1 })),
      ]),
    ]),
  ],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  signupForm: FormGroup;
  text: 'SignIn' | 'SignUp';
  avatar: String = '';
  inbox = [
    {
      name: 'Mailbox',
      message: 'Hi,Welcome to Mailbox.',
      subject: 'Hi,Welcome to Mailbox.',
      time: Date.now(),
      read: false,
    },
  ];
  sentbox = [
    {
      to: '',
      cc: '',
      message: '',
      subject: '',
      time: Date.now(),
    },
  ];
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private auth: AuthService,
    private db: AngularFireDatabase,
    private storage: AngularFireStorage,
    private randomUser: RandomuserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.text = 'SignIn';
    this.loginForm = this.fb.group({
      userName: [
        '',
        [Validators.required, Validators.pattern(/^[A-Za-z]{3,8}$/)],
      ],
      password: [
        '',
        [Validators.required, Validators.pattern(/^[0-9]{6,12}$/)],
      ],
    });
    this.signupForm = this.fb.group({
      userName: [
        '',
        [Validators.required, Validators.pattern(/^[A-Za-z]{3,8}$/)],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]{6,12}$/),
          matchValidator('confirmPassword', true),
        ],
      ],
      confirmPassword: ['', [Validators.required, matchValidator('password')]],
    });

    this.getRandomUser();
    this.initUserData();
  }

  login() {
    let email = this.loginForm.controls.userName.value + '@mailbox.com';
    let pass = this.loginForm.controls.password.value;
    this.auth
      .signIn(email, pass)
      .then((res) => {
        this.openSnackBar('Successfully Login', 'snackbar-success');
        this.router.navigateByUrl('/mailbox');
      })
      .catch((error) => {
        if (error.code === 'auth/wrong-password') {
          this.openSnackBar('Wrong Password', 'snackbar-error');
        }
        if (error.code === 'auth/user-not-found') {
          this.openSnackBar('Please Register to use Mailbox', 'snackbar-error');
        }
      });
  }
  SignUp() {
    let email = this.signupForm.controls.userName.value + '@mailbox.com';
    let pass = this.signupForm.controls.password.value;
    this.auth
      .signUp(email, pass)
      .then((res) => {
        const { uid } = res.user;
        this.db.object(`/users/${uid}`).set({
          id: uid,
          name: this.signupForm.controls.userName.value,
          email: email,
          avatar: this.avatar,
          inbox: this.inbox,
          sentbox: this.sentbox,
        });
      })
      .then((res) => {
        this.openSnackBar(
          'Successfully Registered to Mailbox',
          'snackbar-success'
        );
        this.router.navigateByUrl('/mailbox');
      })
      .catch((error) => {
        this.openSnackBar(error.message, 'snackbar-success');
      });
  }

  getRandomUser() {
    this.randomUser.getAllAlbums().subscribe(
      (res) => {
        res.results.forEach((element) => {
          this.avatar = element.picture.medium;
        });
      },
      (err) => console.log(err)
    );
  }
  initUserData() {
    this.auth.getUser().subscribe(
      (user) => {
        if (user) {
          this.router.navigateByUrl('/mailbox');
        }
      },
      (error) => {
        console.log(error);
      }
    );
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

  tabClick(e) {
    if (e.index === 1) {
      this.text = 'SignUp';
    } else {
      this.text = 'SignIn';
    }
  }
}
