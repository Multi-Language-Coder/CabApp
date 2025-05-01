import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebsockettestComponent } from './websockettest.component';

describe('WebsockettestComponent', () => {
  let component: WebsockettestComponent;
  let fixture: ComponentFixture<WebsockettestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WebsockettestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WebsockettestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
