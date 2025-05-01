import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsertcabdetailsComponent } from './insertcabdetails.component';

describe('InsertcabdetailsComponent', () => {
  let component: InsertcabdetailsComponent;
  let fixture: ComponentFixture<InsertcabdetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InsertcabdetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InsertcabdetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
