import { Component } from '@angular/core';
import { map } from 'rxjs/operators';
import { Breakpoints, BreakpointState, BreakpointObserver } from '@angular/cdk/layout';
import { FormBuilder, FormArray } from '@angular/forms';
import { PricingObject } from '../SalesforceObjs';
import { SalesforceApiService } from '../sf-api-service';

@Component({
    selector: 'app-taxas-dashboard',
    templateUrl: './taxas-dashboard.component.html',
    styleUrls: ['./taxas-dashboard.component.css']
})
export class TaxasDashboardComponent {
    pricingObj: PricingObject;
    nomesExpansionPanels = ['Taxas Visa/Master', 'Taxas Elo', 'Taxas Hiper', 'Taxas Amex'];
    renegociacaoForm = this.fb.group({
        secoes: this.fb.array([])
    });
    panelOpenState = false;
    /** Based on the screen size, switch from standard to one column per row */
    cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
        map(({ matches }) => {
            if (matches) {
                return [
                    { title: 'Card 1', cols: 1, rows: 1 },
                    { title: 'Card 2', cols: 1, rows: 1 },
                    { title: 'Card 3', cols: 1, rows: 1 },
                    { title: 'Card 4', cols: 1, rows: 1 }
                ];
            }

            return [
                { title: 'Card 1', cols: 2, rows: 1 },
                { title: 'Card 2', cols: 1, rows: 1 },
                { title: 'Card 3', cols: 1, rows: 2 },
                { title: 'Card 4', cols: 1, rows: 1 }
            ];
        })
    );

    constructor(
        private breakpointObserver: BreakpointObserver, 
        private fb: FormBuilder, 
        private _sfApi: SalesforceApiService
    ) { }

    ngOnInit() {
        this.nomesExpansionPanels.forEach(nome => {
            this.addSecoes();
        });
        this._sfApi.getAllPricingObjectFromAccount("0014100001kpXQnAAM").subscribe((pricingObjList) => {
            console.log(pricingObjList);
            this.pricingObj = pricingObjList[0];
        });
    }

    get secoes() {
        return this.renegociacaoForm.get('secoes') as FormArray;
    }

    addSecoes() {
        this.secoes.push(this.fb.group({
            debito: this.fb.group({
                taxaAtual: [''],
                clientePediu: [''],
                taxaOferecida: [''],
            }),
            credito: this.fb.group({
                taxaAtual: [''],
                clientePediu: [''],
                taxaOferecida: [''],
            })
        }));
    }

    onSubmit() {
        // TODO: Use EventEmitter with form value
        console.warn(this.renegociacaoForm.value);
        console.log('Enviando PricingObj >>>>>>>>>>>>');
        console.log(this.pricingObj);
        this._sfApi.salvarTesteDanilo(this.pricingObj).subscribe((result) => {
            console.log(result);
        });
    }
}
