import { Component } from '@angular/core';
import { SalesforceApiService } from './sf-api-service';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
    breakpoint: number;
    title = 'app';

    constructor(private _sfApi: SalesforceApiService, private activatedRoute: ActivatedRoute) {}

    ngOnInit() {
        this.breakpoint = (window.innerWidth <= 400) ? 1 : 6;
        this.activatedRoute.queryParams.subscribe((params: Params) => {
            console.log(params);
        });
    }

    onResize(event) {
        this.breakpoint = (event.target.innerWidth <= 400) ? 1 : 6;
    }

}
