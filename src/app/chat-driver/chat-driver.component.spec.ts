import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatDriverComponent } from './chat-driver.component';

describe('ChatDriverComponent', () => {
  let component: ChatDriverComponent;
  let fixture: ComponentFixture<ChatDriverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChatDriverComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatDriverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
