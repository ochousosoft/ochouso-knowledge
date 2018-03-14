import { Component, OnInit, ViewChild, ViewChildren, ElementRef, QueryList, ChangeDetectorRef } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { IMultiSelectOption, IMultiSelectSettings, IMultiSelectTexts } from 'angular-2-dropdown-multiselect';
import * as XLSX from 'xlsx'
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as moment from 'moment';
import * as html2canvas from 'html2canvas';
import { ReportsService } from '../../providers/reports.service';
import { Constants } from  '../../providers/config/constants';
import { AuthenticationService } from '../../providers/index';
import { PostsRestService } from '../../providers/rest/posts.rest.service';
import { Http } from '@angular/http';
import { DialogService } from "ng2-bootstrap-modal";
import { ConfirmComponent } from '../../components/confirm.component/confirm.component';
import { ExportDialogComponent } from '../../components/export-dialog.component/export-dialog.component';

import * as FileSaver from 'file-saver';
import * as htmlDocx from 'html-docx-js/dist/html-docx';

type AOA = any[][];

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  isRequesting = false;
  posts = [];
  Auth:any;
  
  constructor(
    private reportsSrv: ReportsService,
    private authenticationService: AuthenticationService,
    private postsRestSrv: PostsRestService,
    public detector: ChangeDetectorRef,
    private http: Http,
    private dialogService: DialogService
  ) {

    this.Auth = this.authenticationService;


  }

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts(){
    this.isRequesting = true;
    let params:any = {where: {}, projection: 'default'};

    params.order_by = {'id':'DESC'};
    debugger
    this.postsRestSrv.find(params)
      .subscribe(data => {
        this.isRequesting = false;
        this.posts = data.result.data;
      }, error => {
        this.isRequesting = false;
        console.log(error)
      });
  }

}
