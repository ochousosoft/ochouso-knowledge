import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-collapsible-left-sidebar',
  templateUrl: './collapsible-left-sidebar.component.html',
  styleUrls: ['./collapsible-left-sidebar.component.css']
})
export class CollapsibleLeftSidebarComponent implements OnInit {
  activeItem = 1;
  constructor() { }

  ngOnInit() {
  }

}
