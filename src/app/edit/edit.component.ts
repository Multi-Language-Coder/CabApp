import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { Cabdata } from '../../environments/cabdata.interface';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css'],
  standalone:false
})
export class EditComponent implements AfterViewInit, OnDestroy {
  user = "";
  link = "";
  tablerows: HTMLCollectionOf<HTMLTableRowElement> | undefined = undefined;
  cabdataArr: Array<Cabdata> = [];
  numofpages = 0;
  currentpage = 1;
  numRows = 3;

  private destroy$ = new Subject<void>();

  constructor(private route: ActivatedRoute, private http: HttpClient) {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      if (cookie.trim().startsWith("username=")) {
        this.user = cookie.split("=")[1];
        break;
      }
    }
    this.link = "insert/" + this.user;
    this.loadData();
  }

  ngAfterViewInit(): void {
    // This code now runs after the view is initialized, so the table rows will exist.
    this.tablerows = document.getElementsByTagName("tr");
    for (let i = 0; i < this.tablerows.length; i++) {
      let tr = this.tablerows.item(i);
      if (tr && parseInt(tr.id) > 3) {
        tr.setAttribute("style", "position:absolute; left: -9999px;");
      }
    }
    if (this.numofpages === 1) {
      const nextButton = document.getElementById("next");
      if (nextButton) {
        nextButton.className = "page-item disabled";
      }
    }
  }

  loadData() {
    this.http.get<Cabdata[]>(environment.apiBaseUrl + "getCabDetails").pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error loading cab details:', error);
        return of([]); // Return an empty array to prevent breaking the app
      })
    ).subscribe((cabdata) => {
      let i = 1;
      for (let cabdata1 of cabdata) {
        if (cabdata1.userrequested == this.user) {
          cabdata1.id = i;
          this.cabdataArr.push(cabdata1);
          i++;
        }
      }
      this.numofpages = Math.ceil(this.cabdataArr.length / this.numRows);
    });
  }

  delete(id: number) {
    this.http.delete(environment.apiBaseUrl + `cab/${id}`, { responseType: 'text' }).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error deleting cab:', error);
        alert("Failed to delete the ride.");
        return of(null);
      })
    ).subscribe(() => {
      alert("Successfully deleted ride.");
      location.reload();
    });
  }

  goTo(pgNum: number) {
    if (!this.tablerows) return;

    for (let i = 0; i < this.tablerows.length; i++) {
      this.tablerows.item(i)?.setAttribute("style", "position:absolute; left: -9999px;");
    }
    const maxRow = pgNum * this.numRows;
    const rowIds = Array.from({ length: this.numRows }, (_, i) => maxRow - (this.numRows - 1) + i);

    for (const id of rowIds) {
      const row = document.getElementById("" + id);
      if (row) {
        row.setAttribute("style", "");
      }
    }
    this.currentpage = pgNum;

    // Pagination logic
    const prev = document.getElementById("prev");
    const next = document.getElementById("next");
    if (prev) prev.classList.toggle("disabled", pgNum === 1);
    if (next) next.classList.toggle("disabled", pgNum === this.numofpages);
  }

  toUpdPg(id: number) {
    location.href = `/update/${id}?username=${this.user}`;
  }

  toChkPg(id: number) {
    location.href = `/showDetails/${id}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}