import { Component } from '@angular/core';
import { map } from 'rxjs/operators';
import { Breakpoints, BreakpointState, BreakpointObserver } from '@angular/cdk/layout';
import { FormBuilder, FormArray } from '@angular/forms';

@Component({
    selector: 'app-taxas-dashboard',
    templateUrl: './taxas-dashboard.component.html',
    styleUrls: ['./taxas-dashboard.component.css']
})
export class TaxasDashboardComponent {
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

    constructor(private breakpointObserver: BreakpointObserver, private fb: FormBuilder) { }

    ngOnInit() {
        this.nomesExpansionPanels.forEach(nome => {
            this.addSecoes();
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
    }
}
