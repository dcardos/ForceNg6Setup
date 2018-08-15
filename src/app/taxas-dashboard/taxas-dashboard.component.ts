import { Component } from '@angular/core';
import { SalesforceApiService } from '../sf-api-service';
import { PricingObject, Produto, FrontPricing } from '../SalesforceObjs';
import swal from 'sweetalert2';
import { FormBuilder, FormArray, Validators } from '@angular/forms';

@Component({
    selector: 'app-taxas-dashboard',
    templateUrl: './taxas-dashboard.component.html',
    styleUrls: ['./taxas-dashboard.component.css']
})
export class TaxasDashboardComponent {
    breakpoint = 1;
    pricingObj = new PricingObject;
    produtos: Produto[];
    taxasAtuais: number[][];
    estruturaPricing = new Array<FrontPricing>();
    renegociacaoForm = this.fb.group({
        panelsBandeiras: this.fb.array([]),
        panelsProdutos: this.fb.array([]) 
    });

    constructor(
        private fb: FormBuilder,
        private _sfApi: SalesforceApiService
    ) { 
        // inicializando o vetor de taxas atuais
        this.taxasAtuais = [];
        for (let i: number = 0; i < 5; i++) {
            this.taxasAtuais[i] = [];
            for (let j: number = 0; j < 4; j++) {
                this.taxasAtuais[i][j] = null;
            }
        }
    }

    ngOnInit() {
        let nomeTaxasBandeirasComDebito = ['Débito', 'Crédito', 'Crédito 2 a 6x', 'Crédito 7 a 12x'];
        let nomeTaxasBandeirasSemDebito = ['Crédito', 'Crédito 2 a 6x', 'Crédito 7 a 12x'];
        // montando na mão a estrutura de pricing para o front - A ORDEM IMPORTA!
        this.estruturaPricing.push(new FrontPricing('Taxas Visa/Master', nomeTaxasBandeirasComDebito));
        this.estruturaPricing.push(new FrontPricing('Taxas Elo', nomeTaxasBandeirasComDebito));
        this.estruturaPricing.push(new FrontPricing('Taxas Hiper', nomeTaxasBandeirasSemDebito));
        this.estruturaPricing.push(new FrontPricing('Taxas Amex', nomeTaxasBandeirasSemDebito));
        this.estruturaPricing.push(new FrontPricing('Taxas Antecipação Automática', ['Automática', 'Pontual']));
        this.estruturaPricing.forEach(estrutura => {
            // adicionando um array de seções dentro do array de panels
            let secoesForm = this.fb.group({
                secoes: this.fb.array([])
            });
            let secoesFormArray = secoesForm.get('secoes') as FormArray;
            // adicionando campos de taxas necessários (1 grupo de taxas por seção)
            for (let i = 0; i < estrutura.tituloSecoes.length; i++) {
                secoesFormArray.push(this.fb.group({
                    taxaAtual: [''],
                    clientePediu: ['', Validators.pattern('^[0-9]+(.[0-9]{1,2})?$')],
                    taxaOferecida: ['', Validators.pattern('^[0-9]+(.[0-9]{1,2})?$')],
                }));
            } 
            this.panelsBandeiras.push(secoesForm);
        });
        // pegando Id da Account
        let acctId: string;
        let url_string = window.location.href;
        let url = new URL(url_string);
        acctId = url.searchParams.get("id");
        console.log(acctId);
        if (!acctId) {
            swal({
                title: 'Ocorreu um erro',
                text: 'Não foi possível encontrar a account associada (account.id)',
                type: 'error',
                confirmButtonColor: '#14AA48'
            });
        }
        // chamando métodos do SF - pricing object
        this._sfApi.getAllPricingObjectFromAccount(acctId).subscribe((pricingObjList) => {
            console.log('getAllPricingObjectFromAccount id = acctId: ');
            console.log(pricingObjList);
            this.pricingObj = pricingObjList[0];
            // setando taxas atuais - Visa/Master
            this.taxasAtuais[0][0] = this.pricingObj.Atual_Debito__c;
            this.taxasAtuais[0][1] = this.pricingObj.Atual_Credito_a_Vista__c;
            this.taxasAtuais[0][2] = this.pricingObj.Atual_Credito_2_a_6__c;
            this.taxasAtuais[0][3] = this.pricingObj.Atual_Credito_7_a_12__c;
            // setando taxas atuais - Elo
            this.taxasAtuais[1][0] = this.pricingObj.Atual_Debito_EloSub__c;
            this.taxasAtuais[1][1] = this.pricingObj.Atual_Credito_a_Vista_EloSub__c;
            this.taxasAtuais[1][2] = this.pricingObj.Atual_Credito_2_a_6_EloSub__c;
            this.taxasAtuais[1][3] = this.pricingObj.Atual_Credito_7_a_12_EloSub__c;
            // setando taxas atuais - Hiper
            this.taxasAtuais[2][0] = this.pricingObj.Atual_credito_a_vista_hiper__c;
            this.taxasAtuais[2][1] = this.pricingObj.Atual_credito_2_a_6_hiper__c;
            this.taxasAtuais[2][2] = this.pricingObj.Atual_credito_7_a_12_hiper__c;
            // setando taxas atuais - Amex
            this.taxasAtuais[3][0] = this.pricingObj.Atual_Credito_Vista_Amex__c;
            this.taxasAtuais[3][1] = this.pricingObj.Atual_Credito_2_a_6_Amex__c;
            this.taxasAtuais[3][2] = this.pricingObj.Atual_Credito_7_a_12_Amex__c;
            // setando taxas RAV
            this.taxasAtuais[4][0] = this.pricingObj.Atual_Taxa_Automatica__c;
            this.taxasAtuais[4][1] = this.pricingObj.Atual_Taxa_Spot__c;
        });
        
        // método para pegar meios de captura
        this._sfApi.getAllProdutosFromPricing(acctId).subscribe((produtoObjList) => {
            console.log('getAllProdutosFromPricing id = acctId: ');
            console.log(produtoObjList);
            this.produtos = produtoObjList;
            this.produtos.forEach(produto => {
                this.panelsProdutos.push(this.fb.group({
                    aluguelAtual: [''],
                    clientePediuAluguel: ['', Validators.pattern('^[0-9]+(.[0-9]{1,2})?$')],
                    aluguelOferecido: ['', Validators.pattern('^[0-9]+(.[0-9]{1,2})?$')],
                    diaIsencaoAtual: [''],
                    clientePediuIsencao: ['', Validators.pattern('^[0-9]+?$')],
                    diasIsencaoOferecidos: ['', Validators.pattern('^[0-9]+?$')],
                }));
            })
        });
    }

    get panelsBandeiras() {
        return this.renegociacaoForm.get('panelsBandeiras') as FormArray;
    }

    get panelsProdutos() {
        return this.renegociacaoForm.get('panelsProdutos') as FormArray;
    }

    onSubmit() {
        // setando pricing - Visa/Master
        let taxasVisaMaster = this.panelsBandeiras.at(0).get('secoes') as FormArray;
        this.pricingObj.Debito__c = taxasVisaMaster.at(0).get('taxaOferecida').value;
        this.pricingObj.Credito_a_Vista__c = taxasVisaMaster.at(1).get('taxaOferecida').value;
        this.pricingObj.Credito_2_a_6__c = taxasVisaMaster.at(2).get('taxaOferecida').value;
        this.pricingObj.Credito_7_a_12__c = taxasVisaMaster.at(3).get('taxaOferecida').value;
        // taxas Elo
        let taxasElo = this.panelsBandeiras.at(1).get('secoes') as FormArray;
        this.pricingObj.Debito_EloSub__c = taxasElo.at(0).get('taxaOferecida').value;
        this.pricingObj.Credito_a_Vista_EloSub__c = taxasElo.at(1).get('taxaOferecida').value;
        this.pricingObj.Credito_2_a_6_EloSub__c = taxasElo.at(2).get('taxaOferecida').value;
        this.pricingObj.Credito_7_a_12_EloSub__c = taxasElo.at(3).get('taxaOferecida').value;
        // taxas Hiper
        let taxasHiper = this.panelsBandeiras.at(2).get('secoes') as FormArray;
        this.pricingObj.credito_a_vista_hiper__c = taxasHiper.at(0).get('taxaOferecida').value;
        this.pricingObj.credito_2_a_6_hiper__c = taxasHiper.at(1).get('taxaOferecida').value;
        this.pricingObj.credito_7_a_12_hiper__c = taxasHiper.at(2).get('taxaOferecida').value;
        // taxas Amex
        let taxasAmex = this.panelsBandeiras.at(3).get('secoes') as FormArray;
        this.pricingObj.Credito_Vista_Amex__c = taxasAmex.at(0).get('taxaOferecida').value;
        this.pricingObj.Credito_2_a_6_Amex__c = taxasAmex.at(1).get('taxaOferecida').value;
        this.pricingObj.Credito_7_a_12_Amex__c = taxasAmex.at(2).get('taxaOferecida').value;
        // taxas RAV
        let taxasRav = this.panelsBandeiras.at(4).get('secoes') as FormArray;
        this.pricingObj.Taxa_Automatica__c = taxasRav.at(0).get('taxaOferecida').value;
        this.pricingObj.Taxa_Spot__c = taxasRav.at(1).get('taxaOferecida').value;
        // Produtos - meios de captura
        for(let i = 0; i < this.produtos.length; i++) {
            this.produtos[i].Aluguel__c = this.panelsProdutos.at(i).get('aluguelOferecido').value;
            this.produtos[i].Dias_de_Insecao__c = this.panelsProdutos.at(i).get('diasIsencaoOferecidos').value;
        }
        // LOG:
        console.log('Enviando PricingObj >>>>>>>>>>>>');
        console.log(this.pricingObj);
        console.log('Enviando meios de captura >>>>>>>>>>>>');
        console.log(this.produtos);
    }
}
