import { Component, Input } from '@angular/core';
import { DialogComponent, DialogService } from "ng2-bootstrap-modal";
import { Constants } from "../../providers/config/constants";
import { IMultiSelectOption, IMultiSelectSettings, IMultiSelectTexts } from 'angular-2-dropdown-multiselect';
export interface ConfirmModel {
  title:string;
  message:string;
}
@Component({  
    selector: 'app-export-dialog',
    templateUrl: './export-dialog.component.html',
    styleUrls: ['./export-dialog.component.css']
})
export class ExportDialogComponent extends DialogComponent<ConfirmModel, boolean[]> implements ConfirmModel {
  //@Input('charts') charts;
  charts =  Constants.CHARTS;
  title: string;
  message: string;
  chartOptions: any[];
  valueOptions: boolean[];
  constructor(dialogService: DialogService) {
    super(dialogService);   

  }

  ngOnInit() {
    debugger;
    let chartOptions = [];
    let valueOptions = [];
    for(let i = 0; i<Object.keys(Constants.CHARTS).length; i++){
      chartOptions.push({
        name: Constants.CHARTS[i].title,
        value: i
      });

      valueOptions.push(true);
      
    }
    this.valueOptions = valueOptions;
    this.chartOptions = chartOptions;
  }


  confirm() {
    // we set dialog result as true on click on confirm button, 
    // then we can get dialog result from caller code 
    this.result = this.valueOptions;
    this.close();
  }

  markAs(checked){
    for(let i = 0; i<this.valueOptions.length;i++){
      this.valueOptions[i] = checked;
    }
  }

  atLeastOneSelected(){
    let result = false;
    for(let i = 0; i<this.valueOptions.length;i++){
      result = result || this.valueOptions[i];
    }
    return result;
  }
}