import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { delay } from 'rxjs/operators';
import { SideNavService } from '../services/sidenav-service';
import { AngularFireDatabase } from '@angular/fire/database';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import * as _ from 'lodash';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '../snackbar/snackbar.component';

@Component({
  selector: 'app-emaildashboard',
  templateUrl: './emaildashboard.component.html',
  styleUrls: ['./emaildashboard.component.css'],
})
export class EmaildashboardComponent implements OnInit {
  @BlockUI() blockUI: NgBlockUI;
  @ViewChild(MatSidenav)
  sidenav!: MatSidenav;
  users;
  toUserExist: boolean;
  ccUserExist: boolean;
  toUserId;
  ccUserId;
  loggedinUserId;
  errorMessage;
  toUserInbox;
  ccUserInbox;
  loggedInUserInbox;
  userSentBox;
  inboxTableData: boolean = false;
  sentTableData: boolean = true;
  recieverExist: boolean = false;

  @ViewChild('composeMail')
  composeMail: TemplateRef<any>;
  @ViewChild('viewMessge')
  viewMessge: TemplateRef<any>;
  @ViewChild('viewSentMessge')
  viewSentMessge: TemplateRef<any>;
  profileUrl: String = '';
  loggedInUserName;
  selected: boolean;
  clickedItem: 'inbox' | 'sentbox';
  displayedColumns: string[] = ['select', 'name', 'subject', 'time'];
  data = [];
  selection = new SelectionModel<any>(true, []);
  dataSource = new MatTableDataSource<any>(this.data);
  loggedInUserSentBox = [];
  sentdisplayedColumns: string[] = ['to', 'cc', 'subject', 'time'];
  sentdataSource = this.loggedInUserSentBox;

  mailForm: FormGroup = this.fb.group({
    to: ['', [Validators.required]],
    cc: ['', [Validators.required]],
    subject: ['', [Validators.required]],
    message: ['', [Validators.required]],
  });
  sentmailForm: FormGroup = this.fb.group({
    to: ['', [Validators.required]],
    cc: ['', [Validators.required]],
    subject: ['', [Validators.required]],
    message: ['', [Validators.required]],
  });
  messageForm: FormGroup = this.fb.group({
    from: ['', [Validators.required]],
    subject: ['', [Validators.required]],
    message: ['', [Validators.required]],
  });

  constructor(
    private observer: BreakpointObserver,
    private sideNavService: SideNavService,
    private db: AngularFireDatabase,
    private auth: AuthService,
    private userService: UserService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.sideNavService?.sideNavToggleSubject.subscribe(() => {
      this.sidenav?.toggle();
    });
    this.retriveCurrentUserObject();
    this.getUsers();
    this.getLoggedInUserInbox();

    this.clickedItem = 'inbox';
  }
  /*uewqufewyfvyewyfvevry*/
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource?.data?.length;

    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource?.data);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }

    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.position + 1
    }`;
  }
  ngAfterViewInit() {
    this.observer
      .observe(['(max-width: 800px)'])
      .pipe(delay(1))
      .subscribe((res) => {
        if (res.matches) {
          this.sidenav.mode = 'over';
          this.sidenav.close();
        } else {
          this.sidenav.mode = 'side';
          this.sidenav.open();
        }
      });
  }
  getUsers() {
    this.db
      .object('/users')
      .valueChanges()
      .subscribe((obj) => {
        if (obj) {
          this.users = Object.values(obj);
        } else {
          console.log('No USERS');
        }
      });
  }

  retriveCurrentUserObject() {
    this.blockUI.start();
    this.auth.getUser().subscribe((user) => {
      if (user) {
        this.db
          .object(`/users/${user.uid}`)
          .valueChanges()
          .subscribe((userObj) => {
            this.blockUI.stop();
            this.loggedInUserName = userObj['name'];
            this.profileUrl = userObj['avatar'];
            this.loggedInUserSentBox = userObj['sentbox'];
            console.warn(userObj);
            this.populateSentBoxTable();
          });
      }
    });
  }
  getLoggedInUserInbox() {
    this.auth.getUser().subscribe(
      (user) => {
        if (user) {
          this.loggedinUserId = user.uid;
          this.userService.LoadInboxOfLoggedInUser(user.uid).subscribe(
            (inbox) => {
              if (inbox != null) {
                this.inboxTableData = true;
                if (inbox?.length > 1) {
                  this.data = inbox.sort((a, b) => (a.time < b.time ? 1 : -1));
                  this.dataSource = new MatTableDataSource<any>(this.data);

                  this.blockUI.stop();
                } else {
                  if (inbox[0].name === '') {
                    this.inboxTableData = false;
                  }
                  this.data = inbox;
                  this.dataSource = new MatTableDataSource<any>(this.data);
                }
              } else {
                this.inboxTableData = false;
              }
              this.blockUI.stop();
            },
            (err) => {
              console.log(err);
            }
          );
        }
      },
      (error) => {
        console.log(error);
      }
    );
  }
  composeNewMail() {
    this.mailForm.reset();
    this.dialog.open(this.composeMail, {
      position: {
        top: '50px',
      },
      panelClass: 'no-background',
      maxWidth: '800px',
      maxHeight: '100%',
      width: '100%',
    });
  }

  sendMail() {
    if (this.verifyReciverMail()) {
      this.updateToUserInbox();
      this.updateLoggedInUserSentBox();
      this.updateCcUserInbox();
    }
  }

  updateToUserInbox() {
    let arr = this.getToUserObject();
    let touserInboxObj = {
      name: this.loggedInUserName,
      subject: this.mailForm.controls.subject.value,
      message: this.mailForm.controls.message.value,
      time: Date.now(),
      read: false,
    };
    let toUserArr = arr[0].inbox;
    console.log(toUserArr);
    console.log(typeof toUserArr);
    toUserArr.push(touserInboxObj);
    this.db.object(`/users/${this.toUserId}`).set({
      id: arr[0].id,
      name: arr[0].name,
      email: arr[0].email,
      inbox: arr[0].inbox,
      sentbox: toUserArr,
      avatar: arr[0].avatar,
    });
  }
  updateCcUserInbox() {
    let arr = this.getCcUserObject();
    let ccuserInboxObj = {
      name: this.loggedInUserName,
      subject: this.mailForm.controls.subject.value,
      message: this.mailForm.controls.message.value,
      time: Date.now(),
      read: false,
    };
    let toUserArr = arr[0].inbox;
    toUserArr.push(ccuserInboxObj);
    this.db.object(`/users/${this.ccUserId}`).set({
      id: arr[0].id,
      name: arr[0].name,
      email: arr[0].email,
      inbox: arr[0].inbox,
      sentbox: toUserArr,
      avatar: arr[0].avatar,
    });
    this.openSnackBar('Message Sent Successfully', 'snackbar-success');
  }

  updateLoggedInUserSentBox() {
    let arr = this.getCurrentUserObject();
    let sentBoxObj = {
      to: this.mailForm.controls.to.value,
      cc: this.mailForm.controls.cc.value,
      subject: this.mailForm.controls.subject.value,
      message: this.mailForm.controls.message.value,
      time: Date.now(),
    };
    let sentBoxArray = arr[0].sentbox;
    sentBoxArray.push(sentBoxObj);

    this.db.object(`/users/${this.loggedinUserId}`).set({
      id: arr[0].id,
      name: arr[0].name,
      email: arr[0].email,
      inbox: arr[0].inbox,
      sentbox: sentBoxArray,
      avatar: arr[0].avatar,
    });
  }

  getCurrentUserObject() {
    return this.users.filter((element) => element.id == this.loggedinUserId);
  }

  getToUserObject() {
    return this.users.filter((element) => element.id == this.toUserId);
  }
  getCcUserObject() {
    return this.users.filter((element) => element.id == this.ccUserId);
  }

  verifyReciverMail() {
    let user = this.loggedInUserName + '@mailbox.com';

    let toUser = this.mailForm.controls.to.value + '@mailbox.com';
    let ccUser = this.mailForm.controls.cc.value + '@mailbox.com';
    if (user !== toUser && user !== ccUser) {
      if (toUser && ccUser) {
        this.users?.forEach((element) => {
          if (element.email == toUser) {
            this.toUserExist = true;
            this.toUserId = element.id;
          }
          if (element.email == ccUser) {
            this.ccUserExist = true;
            this.ccUserId = element.id;
          }
          if (this.toUserExist && this.ccUserExist) {
            if (this.toUserId != this.ccUserId) {
              this.getToInbox(this.toUserId);
              this.getCcInbox(this.ccUserId);
              return true;
            } else {
              this.openSnackBar(
                'To && cc feilds cannot be same',
                'snackbar-error'
              );

              return false;
            }
          }
        });
        return true;
      } else {
        return false;
      }
    } else {
      this.openSnackBar('Sender and reciever cannot be same', 'snackbar-error');
      return false;
    }
  }

  getToInbox(id) {
    this.userService.inboxOfToUser(id).subscribe((toUserinbox) => {
      this.toUserInbox = toUserinbox;
    });
  }
  getCcInbox(id) {
    this.userService.inboxOfCcUser(id).subscribe((ccUserinbox) => {
      this.ccUserInbox = ccUserinbox;
    });
  }

  getLoggedInUserSentBox() {
    this.blockUI.start;
    this.userService
      .sentboxOfLoggedInUser(this.loggedinUserId)
      .subscribe((userSentBox) => {
        this.blockUI.stop();
        this.userSentBox = userSentBox;
      });
  }
  populateSentBoxTable() {
    console.log(this.loggedInUserSentBox);
    if (this.loggedInUserSentBox.length > 0) {
      let data = this.loggedInUserSentBox.sort((a, b) =>
        a.time < b.time ? 1 : -1
      );
      this.sentdataSource = data;
      this.sentTableData = true;
    } else {
      this.sentTableData = false;
    }
  }
  viewMessage(row) {
    this.messageForm.controls.from.setValue(row.name);
    this.messageForm.controls.subject.setValue(row.subject);
    this.messageForm.controls.message.setValue(row.message);

    this.dialog.open(this.viewMessge, {
      position: {
        top: '50px',
      },
      panelClass: 'no-background',
      maxWidth: '700px',
      maxHeight: '600px',
      width: '100%',
    });
    this.setInboxObjectasRead(row);
  }
  setInboxObjectasRead(row) {
    let arr = this.getCurrentUserObject();
    let inboxArr = arr[0].inbox;
    let index = _.findIndex(inboxArr, row);
    inboxArr[index].read = true;
    this.db.object(`/users/${this.loggedinUserId}`).set({
      id: arr[0].id,
      name: arr[0].name,
      email: arr[0].email,
      inbox: inboxArr,
      sentbox: arr[0].sentbox,
      avatar: arr[0].avatar,
    });
  }
  removeSelectedRows() {
    this.selection.selected.forEach((item) => {
      let index: number = this.data.findIndex((d) => d === item);
      this.dataSource.data.splice(index, 1);
      this.dataSource = new MatTableDataSource<Element>(this.dataSource.data);
    });
    let loggedInUserUpdatedInboxArr = this.dataSource.data;
    let arr = this.getCurrentUserObject();

    if (this.dataSource.data.length > 0) {
      this.db.object(`/users/${this.loggedinUserId}`).set({
        id: arr[0].id,
        name: arr[0].name,
        email: arr[0].email,
        inbox: loggedInUserUpdatedInboxArr,
        sentbox: arr[0].sentbox,
        avatar: arr[0].avatar,
      });
    } else {
      let loggedInUserInboxObj = {
        name: '',
        subject: '',
        message: '',
        time: '',
        read: false,
      };
      let arr = [];
      arr.push(loggedInUserInboxObj);
      this.db.object(`/users/${this.loggedinUserId}`).set({
        id: arr[0].id,
        name: arr[0].name,
        email: arr[0].email,
        inbox: arr,
        sentbox: arr[0].sentbox,
        avatar: arr[0].avatar,
      });
      this.inboxTableData = false;
    }
    this.selection = new SelectionModel<Element>(true, []);
  }

  onClick(item: 'inbox' | 'sentbox') {
    this.clickedItem = item;
  }
  viewSentMessage(row) {
    this.sentmailForm.controls.cc.setValue(row.cc);
    this.sentmailForm.controls.subject.setValue(row.subject);
    this.sentmailForm.controls.message.setValue(row.message);
    this.sentmailForm.controls.to.setValue(row.to);

    this.dialog.open(this.viewSentMessge, {
      position: {
        top: '50px',
      },
      panelClass: 'no-background',
      maxWidth: '700px',
      maxHeight: '600px',
      width: '100%',
    });
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
