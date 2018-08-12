import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { SalesforceApiService } from '../sf-api-service';
import { PricingObject } from '../SalesforceObjs';

@Component({
    selector: 'app-taxas-dashboard',
    templateUrl: './taxas-dashboard.component.html',
    styleUrls: ['./taxas-dashboard.component.css']
})
export class TaxasDashboardComponent {
    pricingObj = new PricingObject;

    constructor(
        private _sfApi: SalesforceApiService
    ) { }

    ngOnInit() {
        this._sfApi.getAllPricingObjectFromAccount("0014100001kpXQnAAM").subscribe((pricingObjList) => {
            console.log(pricingObjList);
            this.pricingObj = pricingObjList[0];
        });
    }

    onSubmit() {
        // setando taxas para o objeto
        console.log('Enviando PricingObj >>>>>>>>>>>>');
        console.log(this.pricingObj);
        this._sfApi.salvarTesteDanilo(this.pricingObj).subscribe((result) => {
            console.log(result);
        });
    }
}
