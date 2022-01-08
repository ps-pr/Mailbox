import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RandomuserService {
  constructor(private _http: HttpClient) {}
  albums_url: string = 'https://randomuser.me/api/';

  getAllAlbums(): Observable<any> {
    return this._http.get(this.albums_url).pipe(tap((data) => data));
  }
}
