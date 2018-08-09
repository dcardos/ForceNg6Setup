
import { fakeAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxasDashboardComponent } from './taxas-dashboard.component';

describe('TaxasDashboardComponent', () => {
    let component: TaxasDashboardComponent;
    let fixture: ComponentFixture<TaxasDashboardComponent>;

    beforeEach(fakeAsync(() => {
        TestBed.configureTestingModule({
            declarations: [TaxasDashboardComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(TaxasDashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should compile', () => {
        expect(component).toBeTruthy();
    });
});
