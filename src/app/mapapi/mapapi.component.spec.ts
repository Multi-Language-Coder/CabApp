import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapapiComponent } from './mapapi.component';

describe('MapapiComponent', () => {
  let component: MapapiComponent;
  let fixture: ComponentFixture<MapapiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapapiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapapiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
