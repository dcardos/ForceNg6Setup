import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
    breakpoint: number;
    title = 'app';

    constructor() {}

    ngOnInit() {
        this.breakpoint = (window.innerWidth <= 400) ? 1 : 6;
    }

    onResize(event) {
        this.breakpoint = (event.target.innerWidth <= 400) ? 1 : 6;
    }

}
