import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CollapsibleLeftSidebarComponent } from './collapsible-left-sidebar.component';

describe('CollapsibleLeftSidebarComponent', () => {
  let component: CollapsibleLeftSidebarComponent;
  let fixture: ComponentFixture<CollapsibleLeftSidebarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CollapsibleLeftSidebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollapsibleLeftSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
