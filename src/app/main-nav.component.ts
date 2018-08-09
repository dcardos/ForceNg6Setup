import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SalesforceApiService } from './sf-api-service';

@Component({
    selector: 'app-main-nav',
    templateUrl: './main-nav.component.html',
    styleUrls: ['./main-nav.component.css']
})
export class MainNavComponent {

    isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
        .pipe(
            map(result => result.matches)
        );

    constructor(private breakpointObserver: BreakpointObserver, private _sfApi: SalesforceApiService) { }

    ngOnInit() {
        this._sfApi.getAllPricingObjectFromAccount("0014100001kpXQnAAM", "784616978").subscribe((pricingObj) => {
            console.log(pricingObj);
        });
    }

}
