import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../providers/authentication.service';
import { Router, ActivatedRoute } from '@angular/router';
import { FilterMem } from '../../providers/memory/filter.memory';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {
  Auth;
  constructor(
    private authenticationService: AuthenticationService,
    private filterMem: FilterMem,
    private router: Router
  ) { 
    this.Auth = authenticationService;
  }

  ngOnInit() {

  }

  logOut(){
    this.authenticationService.destroySession();
    this.filterMem.clear();
    this.router.navigate(['login']);
  }

}
