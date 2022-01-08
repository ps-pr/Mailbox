import { ConstantPool } from '@angular/compiler';
import { Injectable } from '@angular/core';

import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private db: AngularFireDatabase) {}
  Inbox: Array<object> = [];

  LoadInboxOfLoggedInUser(id): Observable<any> {
    return this.db.object(`/users/${id}/inbox`).valueChanges();
  }

  inboxOfToUser(id): Observable<any> {
    return this.db.object(`/users/${id}/inbox`).valueChanges();
  }
  inboxOfCcUser(id): Observable<any> {
    return this.db.object(`/users/${id}/inbox`).valueChanges();
  }
  sentboxOfLoggedInUser(id): Observable<any> {
    return this.db.object(`/users/${id}/sentbox`).valueChanges();
  }
}
