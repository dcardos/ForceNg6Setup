import { Component } from '@angular/core';
import { SalesforceApiService } from './sf-api-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
    breakpoint: number;
    title = 'app';

    constructor(private _sfApi: SalesforceApiService) {}

    ngOnInit() {
        this._sfApi.getAllPricingObjectFromAccount("0014100001lWYu5AAG", "192658343").subscribe((pricingObj) => {
            console.log(pricingObj);
        });
        this.breakpoint = (window.innerWidth <= 400) ? 1 : 6;
    }

    onResize(event) {
        this.breakpoint = (event.target.innerWidth <= 400) ? 1 : 6;
    }

}
