import { Component } from '@angular/core';
import { SalesforceApiService } from '../sf-api-service';
import { PricingObject, Produto, FrontPricing, AccountSF, Usuario, LinhaTabelaReneg } from '../SalesforceObjs';
import swal from 'sweetalert2';
import { FormBuilder, FormArray, Validators } from '@angular/forms';

@Component({
    selector: 'app-taxas-dashboard',
    templateUrl: './taxas-dashboard.component.html',
    styleUrls: ['./taxas-dashboard.component.css']
})
export class TaxasDashboardComponent {
    breakpoint: number;
    loader = 0;
    dataCriacaoRenegociacao: Date;
    userId: string;
    usuarioDono: Usuario;
    usuarioCriador: Usuario;
    usuarioAtual: Usuario;
    _pricingObj: PricingObject;
    account = new AccountSF;
    produtos: Produto[];
    taxasAtuais: number[][];
    taxasPedidas: number[][];
    taxasOferecidas: number[][];
    taxasNet: number[][];
    balizador: number[][];
    ultimoDescarte: string;
    estruturaPricing = new Array<FrontPricing>();
    renegociacaoForm = this.fb.group({
        panelsBandeiras: this.fb.array([]),
        panelsProdutos: this.fb.array([]),
        tpvEstimado: ['', [Validators.pattern('^[0-9]+(.[0-9]{1,2})?$')]],
        qtdLoja: ['', [Validators.pattern('^[0-9]+$')]],
        justificativaProposta: [''],
        cobreConcorrencia: [false]
    });
    tabelaReneg: LinhaTabelaReneg[];

    constructor(
        private fb: FormBuilder,
        private _sfApi: SalesforceApiService
    ) { 
        // inicializando o vetor de taxas atuais
        this.taxasAtuais = [];
        this.taxasOferecidas = [];
        this.taxasPedidas = [];
        this.taxasNet = [];
        this.balizador = [];
        for (let i: number = 0; i < 5; i++) {
            this.taxasAtuais[i] = [];
            this.taxasOferecidas[i] = [];
            this.taxasPedidas[i] = [];
            this.taxasNet[i] = [];
            this.balizador[i] = [];
            for (let j: number = 0; j < 4; j++) {
                this.taxasAtuais[i][j] = null;
                this.taxasOferecidas[i][j] = null;
                this.taxasPedidas[i][j] = null;
                this.taxasNet[i][j] = null;
                this.balizador[i][j] = null;
            }
        }
    }

    
    public set pricingObj(pricing : PricingObject) {
        this._pricingObj = pricing;
        if (this.pricingObj.errorNewPricing__c && this.pricingObj.errorNewPricing__c.length > 0) {
            swal({
                title: 'Atenção',
                text: 'Ocorreu um erro. Mensagem do servidor: ' + this.pricingObj.errorNewPricing__c,
                type: 'warning',
                confirmButtonColor: '#14AA48'
            });
        }
        if (this._pricingObj.CreatedDate) {
            this.dataCriacaoRenegociacao = new Date(this._pricingObj.CreatedDate);
        }
        console.log('PRICING RECEBIDO: ');
        console.log(pricing);
        this.populaMatrixTaxaAtual();
        // this.populaMatrixCliente();
        this.populaMatrixTaxaOferecida();
        this.populaMatrixNet();
        this.populaBalizador();
        console.log('TAXAS ATUAIS: ');
        console.log(this.taxasAtuais);
        console.log('TAXAS OFERECIDAS: ');
        console.log(this.taxasOferecidas);
        console.log('TAXAS NET: ');
        console.log(this.taxasNet);
        console.log('TAXAS BALIZADOR: ');
        console.log(this.balizador);
        // mostrando no form as taxas pedidas e oferecidas:
        for (let i = 0; i < this.estruturaPricing.length; i++) {
            for (let j = 0; j < this.estruturaPricing[i].tituloSecoes.length; j++) {
                // (<FormArray>this.panelsBandeiras.at(i).get('secoes')).at(j).patchValue({ clientePediu: this.taxasPedidas[i][j] });
                (<FormArray>this.panelsBandeiras.at(i).get('secoes')).at(j).patchValue({ taxaOferecida: this.taxasOferecidas[i][j], valorNet: this.taxasNet[i][j] });
            }
        }
        this.renegociacaoForm.patchValue({ justificativaProposta: this.pricingObj.Justificativa_de_Proposta__c });
        // pegando usuário dono da negociação
        if (this.pricingObj.OwnerId) {
            this._sfApi.userInfoById(this.pricingObj.OwnerId).subscribe(usuario => {
                this.usuarioDono = usuario;
            });
        }
        // pegando usuário criador da negociação
        if (this.pricingObj.CreatedById) {
            // console.log("Buscando pricing criador com id: " + this.pricingObj.CreatedById);
            this._sfApi.userInfoById(this.pricingObj.CreatedById).subscribe(usuario => {
                // console.log(usuario);
                this.usuarioCriador = new Usuario(usuario);
            });
        } else if (this.userId){
            // console.log("Buscando usuario criador com id: " + this.userId);
            this.usuarioCriador = this.usuarioAtual;
        }
    }

    public get pricingObj() {
        return this._pricingObj;
    }
    

    ngOnInit() {
        // para tela responsiva
        this.breakpoint = (window.innerWidth <= 400) ? 1 : 3;
        // para estrutura de paineis expansíveis no front
        let nomeTaxasBandeirasComDebito = ['Débito', 'Crédito', 'Crédito 2 a 6x', 'Crédito 7 a 12x'];
        let nomeTaxasBandeirasSemDebito = ['Crédito', 'Crédito 2 a 6x', 'Crédito 7 a 12x'];
        // montando na mão a estrutura de pricing para o front - A ORDEM IMPORTA!
        this.estruturaPricing.push(new FrontPricing('Taxas Visa/Master', nomeTaxasBandeirasComDebito));
        this.estruturaPricing.push(new FrontPricing('Taxas Elo', nomeTaxasBandeirasComDebito));
        this.estruturaPricing.push(new FrontPricing('Taxas Hiper', nomeTaxasBandeirasSemDebito));
        this.estruturaPricing.push(new FrontPricing('Taxas Amex', nomeTaxasBandeirasSemDebito));
        this.estruturaPricing.push(new FrontPricing('Taxas Antecipação', ['Automática', 'Pontual']));
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
                    taxaOferecida: ['', [Validators.pattern('^[0-9]+(.[0-9]{1,2})?$'), Validators.max(9)]],
                    valorNet: [''],
                }));
            } 
            this.panelsBandeiras.push(secoesForm);
        });
        // pegando Id da Account e userId
        let acctId: string;
        let url_string = window.location.href;
        let url = new URL(url_string);
        acctId = url.searchParams.get("acctId");
        this.userId = url.searchParams.get("userId");
        console.log('acctId: ' + acctId);
        console.log('userId: ' + this.userId);
        if (!acctId) {
            swal({
                title: 'Ocorreu um erro',
                text: 'Não foi possível encontrar a account associada (account.id)',
                type: 'error',
                confirmButtonColor: '#14AA48'
            });
            return;
        }
        if (!this.userId) {
            swal({
                title: 'Ocorreu um erro',
                text: 'Não foi possível encontrar o seu id do Salesforce',
                type: 'error',
                confirmButtonColor: '#14AA48'
            });
            return;
        }
        // pegando info do usuário logado
        this._sfApi.userInfoById(this.userId).subscribe(usuario => {
            this.usuarioAtual = new Usuario(usuario);
        });
        // pegar a conta
        this.loader++;
        this._sfApi.getAccountInfos(acctId).subscribe((account) => {
            this.loader--;
            console.log('Account <<<<<<<<<<<<<<<');
            console.log(account);
            this.account = account;
            this.renegociacaoForm.patchValue({ tpvEstimado: this.account.ExpectedTPV__c, qtdLoja: this.account.Quantidade_de_Lojas__c});
        });
        // chamando métodos do SF - pricing object
        this.loader++;
        this._sfApi.getAllPricingObjectFromAccount(acctId).subscribe((pricingObjList) => {
            this.loader--;
            console.log("All pricing objects (list): ");
            console.log(pricingObjList);
            this.pricingObj = pricingObjList[0];
            for (let i = pricingObjList.length-1; i >= 0; i--) {
                if (pricingObjList[i].Justificativa_de_descarte__c) {
                    this.ultimoDescarte = pricingObjList[i].Justificativa_de_descarte__c;
                    break;
                }
            }
            // if (this.pricingObj.Pricing_Status__c !== 'Novo') this.montaTabela(pricingObjList);
        });
        
        // método para pegar meios de captura
        this.loader++;
        this._sfApi.getAllProdutosFromPricing(acctId).subscribe((produtoObjList) => {
            this.loader--;
            console.log('getAllProdutosFromPricing id = acctId: ');
            console.log(produtoObjList);
            this.produtos = produtoObjList;
            this.produtos.forEach(produto => {
                this.panelsProdutos.push(this.fb.group({
                    aluguelAtual: [produto.Atual_Aluguel__c],
                    clientePediuAluguel: [produto.Cliente_Aluguel__c, Validators.pattern('^[0-9]+(.[0-9]{1,2})?$')],
                    aluguelOferecido: [produto.Aluguel__c, [Validators.pattern('^[0-9]+(.[0-9]{1,2})?$'), Validators.max(500)]],
                    diaIsencaoAtual: [''],
                    clientePediuIsencao: [produto.Cliente_Dias_de_Insecao__c, Validators.pattern('^[0-9]+?$')],
                    diasIsencaoOferecidos: [produto.Dias_de_Insecao__c, [Validators.pattern('^[0-9]+?$'), Validators.max(999)]],
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

    // para tela responsiva
    onResize(event) {
        this.breakpoint = (event.target.innerWidth <= 400) ? 1 : 3;
    }

    onSubmit() {
        // // setando pricing taxas pedidas
        let taxasVisaMaster = this.panelsBandeiras.at(0).get('secoes') as FormArray;
        // this.pricingObj.Cliente_Debito__c = taxasVisaMaster.at(0).get('clientePediu').value;
        // this.pricingObj.Cliente_Credito_a_Vista_Master__c = taxasVisaMaster.at(1).get('clientePediu').value;
        // this.pricingObj.Cliente_Credito_2_a_6_Master__c = taxasVisaMaster.at(2).get('clientePediu').value;
        // this.pricingObj.Cliente_Credito_7_a_12_Master__c = taxasVisaMaster.at(3).get('clientePediu').value;
        // // taxas Elo
        let taxasElo = this.panelsBandeiras.at(1).get('secoes') as FormArray;
        // this.pricingObj.Cliente_Debito_EloSub__c = taxasElo.at(0).get('clientePediu').value;
        // this.pricingObj.Cliente_Credito_a_Vista_EloSub__c = taxasElo.at(1).get('clientePediu').value;
        // this.pricingObj.Cliente_Credito_2_a_6_EloSub__c = taxasElo.at(2).get('clientePediu').value;
        // this.pricingObj.Cliente_Credito_7_a_12_EloSub__c = taxasElo.at(3).get('clientePediu').value;
        // // taxas Hiper
        let taxasHiper = this.panelsBandeiras.at(2).get('secoes') as FormArray;
        // this.pricingObj.Cliente_credito_a_vista_hiper__c = taxasHiper.at(0).get('clientePediu').value;
        // this.pricingObj.Cliente_credito_2_a_6_hiper__c = taxasHiper.at(1).get('clientePediu').value;
        // this.pricingObj.Cliente_credito_7_a_12_hiper__c = taxasHiper.at(2).get('clientePediu').value;
        // // taxas Amex
        let taxasAmex = this.panelsBandeiras.at(3).get('secoes') as FormArray;
        // this.pricingObj.Cliente_Credito_Vista_Amex__c = taxasAmex.at(0).get('clientePediu').value;
        // this.pricingObj.Cliente_Credito_2_a_6_Amex__c = taxasAmex.at(1).get('clientePediu').value;
        // this.pricingObj.Cliente_Credito_7_a_12_Amex__c = taxasAmex.at(2).get('clientePediu').value;
        // // taxas RAV
        let taxasRav = this.panelsBandeiras.at(4).get('secoes') as FormArray;
        // this.pricingObj.Cliente_Taxa_Automatica__c = taxasRav.at(0).get('clientePediu').value;
        // this.pricingObj.Cliente_Taxa_Spot__c = taxasRav.at(1).get('clientePediu').value;
        // setando pricing taxas oferecidas - Visa/Master
        this.pricingObj.Debito__c = (taxasVisaMaster.at(0).get('taxaOferecida').value) ? taxasVisaMaster.at(0).get('taxaOferecida').value : this.pricingObj.Atual_Debito__c;
        this.pricingObj.Credito_a_Vista__c = (taxasVisaMaster.at(1).get('taxaOferecida').value) ? taxasVisaMaster.at(1).get('taxaOferecida').value : this.pricingObj.Atual_Credito_a_Vista__c;
        this.pricingObj.Credito_2_a_6__c = (taxasVisaMaster.at(2).get('taxaOferecida').value) ? taxasVisaMaster.at(2).get('taxaOferecida').value : this.pricingObj.Atual_Credito_2_a_6__c;
        this.pricingObj.Credito_7_a_12__c = (taxasVisaMaster.at(3).get('taxaOferecida').value) ? taxasVisaMaster.at(3).get('taxaOferecida').value : this.pricingObj.Atual_Credito_7_a_12__c;
        // taxas Elo
        this.pricingObj.Debito_EloSub__c = (taxasElo.at(0).get('taxaOferecida').value) ? taxasElo.at(0).get('taxaOferecida').value : this.pricingObj.Atual_Debito_EloSub__c;
        this.pricingObj.Credito_a_Vista_EloSub__c = (taxasElo.at(1).get('taxaOferecida').value) ? taxasElo.at(1).get('taxaOferecida').value : this.pricingObj.Atual_Credito_a_Vista_EloSub__c;
        this.pricingObj.Credito_2_a_6_EloSub__c = (taxasElo.at(2).get('taxaOferecida').value) ? taxasElo.at(2).get('taxaOferecida').value : this.pricingObj.Atual_Credito_2_a_6_EloSub__c;
        this.pricingObj.Credito_7_a_12_EloSub__c = (taxasElo.at(3).get('taxaOferecida').value) ? taxasElo.at(3).get('taxaOferecida').value : this.pricingObj.Atual_Credito_7_a_12_EloSub__c;
        // taxas Hiper
        this.pricingObj.credito_a_vista_hiper__c = (taxasHiper.at(0).get('taxaOferecida').value) ? taxasHiper.at(0).get('taxaOferecida').value : this.pricingObj.Atual_credito_a_vista_hiper__c;
        this.pricingObj.credito_2_a_6_hiper__c = (taxasHiper.at(1).get('taxaOferecida').value) ? taxasHiper.at(1).get('taxaOferecida').value : this.pricingObj.Atual_credito_2_a_6_hiper__c;
        this.pricingObj.credito_7_a_12_hiper__c = (taxasHiper.at(2).get('taxaOferecida').value) ? taxasHiper.at(2).get('taxaOferecida').value : this.pricingObj.Atual_credito_7_a_12_hiper__c;
        // taxas Amex
        this.pricingObj.Credito_Vista_Amex__c = (taxasAmex.at(0).get('taxaOferecida').value) ? taxasAmex.at(0).get('taxaOferecida').value : this.pricingObj.Atual_Credito_Vista_Amex__c;
        this.pricingObj.Credito_2_a_6_Amex__c = (taxasAmex.at(1).get('taxaOferecida').value) ? taxasAmex.at(1).get('taxaOferecida').value : this.pricingObj.Atual_Credito_2_a_6_Amex__c
        this.pricingObj.Credito_7_a_12_Amex__c = (taxasAmex.at(2).get('taxaOferecida').value) ? taxasAmex.at(2).get('taxaOferecida').value : this.pricingObj.Atual_Credito_7_a_12_Amex__c;
        // taxas RAV
        this.pricingObj.Taxa_Automatica__c = (taxasRav.at(0).get('taxaOferecida').value) ? taxasRav.at(0).get('taxaOferecida').value : this.pricingObj.Atual_Taxa_Automatica__c;
        this.pricingObj.Taxa_Spot__c = (taxasRav.at(1).get('taxaOferecida').value) ? taxasRav.at(1).get('taxaOferecida').value : this.pricingObj.Atual_Taxa_Spot__c;
        // cobrir concorrencia?
        this.pricingObj.Cobrir_Concorrencia__c = this.renegociacaoForm.get('cobreConcorrencia').value;
        // Produtos - meios de captura
        if (this.produtos) {
            for(let i = 0; i < this.produtos.length; i++) {
                this.produtos[i].Aluguel__c = (this.panelsProdutos.at(i).get('aluguelOferecido').value) ? this.panelsProdutos.at(i).get('aluguelOferecido').value : this.produtos[i].Atual_Aluguel__c;
                // this.produtos[i].Cliente_Aluguel__c = this.panelsProdutos.at(i).get('clientePediuAluguel').value;
                this.produtos[i].Dias_de_Insecao__c = (this.panelsProdutos.at(i).get('diasIsencaoOferecidos').value) ? this.panelsProdutos.at(i).get('diasIsencaoOferecidos').value : 0;
                // this.produtos[i].Cliente_Dias_de_Insecao__c = this.panelsProdutos.at(i).get('clientePediuIsencao').value;
            }
        }
        // tratando account
        this.account.ExpectedTPV__c = this.renegociacaoForm.get('tpvEstimado').value;
        this.account.Quantidade_de_Lojas__c = this.renegociacaoForm.get('qtdLoja').value;
        // verificando no formulário
        if (!this.account.ExpectedTPV__c) {
            swal({
                title: 'Atenção',
                text: 'Preencha o TPV Estimado',
                type: 'warning',
                confirmButtonColor: '#14AA48'
            });
            return;
        }
        if (!this.account.Quantidade_de_Lojas__c) {
            swal({
                title: 'Atenção',
                text: 'Preencha a quantidade de loja',
                type: 'warning',
                confirmButtonColor: '#14AA48'
            });
            return;
        }
        if (!this.pricingObj.Credito_Vista_Amex__c || !this.pricingObj.Credito_2_a_6_Amex__c || !this.pricingObj.Credito_7_a_12_Amex__c) {
            swal({
                title: 'Atenção',
                text: 'Taxas amex devem ser preenchidas!',
                type: 'warning',
                confirmButtonColor: '#14AA48'
            });
            return;
        }
        if (!this.verificaSeMudouAlgumaCondicao()) {
            swal({
                title: 'Atenção',
                text: 'Nenhuma taxa ou condição foi modificada!',
                type: 'warning',
                confirmButtonColor: '#14AA48'
            });
            return;
        }
        // LOG:
        console.log('Enviando account verificar alcada>>>>>>>>>>>>');
        console.log(this.account);
        console.log('Enviando PricingObj verificar alcada>>>>>>>>>>>>');
        console.log(this.pricingObj);
        console.log('Enviando meios de captura verificar alcada>>>>>>>>>>>>');
        console.log(this.produtos);
        // chamar verificar alçada
        this.loader++;
        this._sfApi.verificarAlcada(this.pricingObj, this.produtos, this.account).subscribe((pricingObj) => {
            this.loader--;
            console.log('<<< pricingObj - verificar Alçada');
            console.log(pricingObj);
            if (!pricingObj) {
                swal({
                    title: 'Ocorreu um erro',
                    text: 'Objeto de preço retornado está vazio',
                    type: 'error',
                    confirmButtonColor: '#14AA48'
                });
                return;
            } else if (pricingObj.Pricing_Status__c === 'Tem Alçada') {
                swal({
                    title: 'Show',
                    text: 'Você tem alçada',
                    type: 'success',
                    confirmButtonColor: '#14AA48'
                });
            } else {
                swal({
                    title: 'Atenção',
                    text: 'Você não tem alçada',
                    type: 'warning',
                    confirmButtonColor: '#14AA48'
                });
            } 
            this.pricingObj = pricingObj;
        });
    }

    pedirAprovacao() {
        this.pricingObj.Justificativa_de_Proposta__c = this.renegociacaoForm.get('justificativaProposta').value;
        // console.log('JUSTIFICATIVA DE PROPOSTA fomr:');
        // console.log(this.renegociacaoForm.get('justificativaProposta'));
        console.log('JUSTIFICATIVA DE PROPOSTA: ' + this.pricingObj.Justificativa_de_Proposta__c);
        this.loader++;
        this._sfApi.pedirAprovacao(this.pricingObj, this.produtos, this.account).subscribe((pricingObj) => {
            this.loader--;
            console.log('<<< pricingObj - pedir aprovaçao');
            console.log(pricingObj);
            if (!pricingObj) {
                swal({
                    title: 'Ocorreu um erro',
                    text: 'Objeto de preço retornado está vazio',
                    type: 'error',
                    confirmButtonColor: '#14AA48'
                });
            } else {
                this.pricingObj = pricingObj;
                swal({
                    title: 'Pedido enviado',
                    text: 'Pedido de aprovação enviado para ' + this.pricingObj.email_aprovador__c,
                    type: 'success',
                    confirmButtonColor: '#14AA48'
                });
            }
        });
    }

    async descartar() {
        this.loader++;
        if (this.userId != this.pricingObj.CreatedById) {
            const { value: text } = await swal({
                text: 'Qual o motivo do descarte?',
                input: 'textarea',
                inputPlaceholder: 'Rasgou a taxa',
                showCancelButton: true,
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#14AA48'
            })
            if (text) {
                console.log('Texto de descarte: ' + text);
                this.pricingObj.Justificativa_de_descarte__c = text;
            } else {
                this.loader--;
                return;
            }
        }
        // LOG:
        console.log('Enviando account descartar>>>>>>>>>>>>');
        console.log(this.account);
        console.log('Enviando PricingObj descartar>>>>>>>>>>>>');
        console.log(this.pricingObj);
        console.log('Enviando meios de captura descartar>>>>>>>>>>>>');
        console.log(this.produtos);
        this._sfApi.desistir(this.pricingObj, this.produtos, this.account).subscribe(pricingObj => {
            this.loader--;
            console.log('<<< pricingObj - descartar');
            console.log(pricingObj);
            if (!pricingObj) {
                swal({
                    title: 'Ocorreu um erro',
                    text: 'Objeto de preço retornado está vazio',
                    type: 'error',
                    confirmButtonColor: '#14AA48'
                });
            } else {
                this.pricingObj = pricingObj;
                swal({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    type: 'success',
                    title: 'Renegociação descartada'
                });
            }
        });
    }

    aprovar() {
        this.loader++;
        this._sfApi.aprovar(this.pricingObj, this.produtos, this.account).subscribe((pricingObj) => {
            this.loader--;
            console.log('<<< pricingObj - aprovar');
            console.log(pricingObj);
            if (!pricingObj) {
                swal({
                    title: 'Ocorreu um erro',
                    text: 'Objeto de preço retornado está vazio',
                    type: 'error',
                    confirmButtonColor: '#14AA48'
                });
            } else {
                this.pricingObj = pricingObj;
                swal({
                    title: 'Taxas aprovadas',
                    text: 'Essa renegociação está aguardando o Ok do cliente',
                    type: 'success',
                    confirmButtonColor: '#14AA48'
                });
            }
        });
    }

    clienteAprovou() {
        this.loader++;
        this._sfApi.okCliente(this.pricingObj, this.produtos, this.account).subscribe((pricingObj) => {
            this.loader--;
            console.log('<<< pricingObj - aprovar');
            console.log(pricingObj);
            if (!pricingObj) {
                swal({
                    title: 'Ocorreu um erro',
                    text: 'Objeto de preço retornado está vazio',
                    type: 'error',
                    confirmButtonColor: '#14AA48'
                });
            } else {
                this.pricingObj = pricingObj;
                swal({
                    title: 'Renegociação finalizada',
                    text: 'Novas condições em vigor!',
                    type: 'success',
                    confirmButtonColor: '#14AA48'
                });
            }
        });
    }

    mostrarJustificativa() {
        swal({
            title: 'Última justificativa de descarte',
            text: this.ultimoDescarte,
            confirmButtonColor: '#14AA48'
        });
    }

    mostraSwalConco() {
        if (this.renegociacaoForm.get('cobreConcorrencia').value) {
            swal({
                title: 'Leia com atenção!',
                text: "Você deverá anexar uma foto que comprove as taxas oferecidas pela concorrência após a aprovação desta renegociação!",
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#14AA48',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Li e anexarei quando aprovado!'
            }).then((result) => {
                if (result.value) {
                    swal({
                        text: 'Perfeito! Lembre-se, quando esta renegociação for aprovada, anexe o comprovante (foto) indo na conta do cliente no botão "publicar"!',
                        type: 'info',
                        confirmButtonColor: '#14AA48'
                    })
                } else {
                    this.renegociacaoForm.patchValue({cobreConcorrencia: false});
                }
            })
        }
    }

    private populaMatrixTaxaAtual() {
        // setando taxas atuais - Visa/Master
        this.taxasAtuais[0][0] = this._pricingObj.Atual_Debito__c;
        this.taxasAtuais[0][1] = this._pricingObj.Atual_Credito_a_Vista__c;
        this.taxasAtuais[0][2] = this._pricingObj.Atual_Credito_2_a_6__c;
        this.taxasAtuais[0][3] = this._pricingObj.Atual_Credito_7_a_12__c;
        // setando taxas atuais - Elo
        this.taxasAtuais[1][0] = this._pricingObj.Atual_Debito_EloSub__c;
        this.taxasAtuais[1][1] = this._pricingObj.Atual_Credito_a_Vista_EloSub__c;
        this.taxasAtuais[1][2] = this._pricingObj.Atual_Credito_2_a_6_EloSub__c;
        this.taxasAtuais[1][3] = this._pricingObj.Atual_Credito_7_a_12_EloSub__c;
        // setando taxas atuais - Hiper
        this.taxasAtuais[2][0] = this._pricingObj.Atual_credito_a_vista_hiper__c;
        this.taxasAtuais[2][1] = this._pricingObj.Atual_credito_2_a_6_hiper__c;
        this.taxasAtuais[2][2] = this._pricingObj.Atual_credito_7_a_12_hiper__c;
        // setando taxas atuais - Amex
        this.taxasAtuais[3][0] = this._pricingObj.Atual_Credito_Vista_Amex__c;
        this.taxasAtuais[3][1] = this._pricingObj.Atual_Credito_2_a_6_Amex__c;
        this.taxasAtuais[3][2] = this._pricingObj.Atual_Credito_7_a_12_Amex__c;
        // setando taxas atuais RAV
        this.taxasAtuais[4][0] = this._pricingObj.Atual_Taxa_Automatica__c;
        this.taxasAtuais[4][1] = this._pricingObj.Atual_Taxa_Spot__c;
    }

    private populaMatrixTaxaOferecida() {
        // setando taxas oferecidas - Visa/Master
        this.taxasOferecidas[0][0] = this._pricingObj.Debito__c;
        this.taxasOferecidas[0][1] = this._pricingObj.Credito_a_Vista__c;
        this.taxasOferecidas[0][2] = this._pricingObj.Credito_2_a_6__c;
        this.taxasOferecidas[0][3] = this._pricingObj.Credito_7_a_12__c;
        // setando taxas oferecidas - Elo
        this.taxasOferecidas[1][0] = this._pricingObj.Debito_EloSub__c;
        this.taxasOferecidas[1][1] = this._pricingObj.Credito_a_Vista_EloSub__c;
        this.taxasOferecidas[1][2] = this._pricingObj.Credito_2_a_6_EloSub__c;
        this.taxasOferecidas[1][3] = this._pricingObj.Credito_7_a_12_EloSub__c;
        // setando taxas oferecidas - Hiper
        this.taxasOferecidas[2][0] = this._pricingObj.credito_a_vista_hiper__c;
        this.taxasOferecidas[2][1] = this._pricingObj.credito_2_a_6_hiper__c;
        this.taxasOferecidas[2][2] = this._pricingObj.credito_7_a_12_hiper__c;
        // setando taxas oferecidas - Amex
        this.taxasOferecidas[3][0] = this._pricingObj.Credito_Vista_Amex__c;
        this.taxasOferecidas[3][1] = this._pricingObj.Credito_2_a_6_Amex__c;
        this.taxasOferecidas[3][2] = this._pricingObj.Credito_7_a_12_Amex__c;
        // setando taxas oferecidas RAV
        this.taxasOferecidas[4][0] = this._pricingObj.Taxa_Automatica__c;
        this.taxasOferecidas[4][1] = this._pricingObj.Taxa_Spot__c;
    }

    private populaMatrixCliente() {
        // setando taxas pedidas - Visa/Master
        this.taxasPedidas[0][0] = this._pricingObj.Cliente_Debito__c;
        this.taxasPedidas[0][1] = this._pricingObj.Cliente_Credito_a_Vista_Master__c;
        this.taxasPedidas[0][2] = this._pricingObj.Cliente_Credito_2_a_6_Master__c;
        this.taxasPedidas[0][3] = this._pricingObj.Cliente_Credito_7_a_12_Master__c;
        // setando taxas pedidas - Elo
        this.taxasPedidas[1][0] = this._pricingObj.Cliente_Debito_EloSub__c;
        this.taxasPedidas[1][1] = this._pricingObj.Cliente_Credito_a_Vista_EloSub__c;
        this.taxasPedidas[1][2] = this._pricingObj.Cliente_Credito_2_a_6_EloSub__c;
        this.taxasPedidas[1][3] = this._pricingObj.Cliente_Credito_7_a_12_EloSub__c;
        // setando taxas pedidas - Hiper
        this.taxasPedidas[2][0] = this._pricingObj.Cliente_credito_a_vista_hiper__c;
        this.taxasPedidas[2][1] = this._pricingObj.Cliente_credito_2_a_6_hiper__c;
        this.taxasPedidas[2][2] = this._pricingObj.Cliente_credito_7_a_12_hiper__c;
        // setando taxas pedidas - Amex
        this.taxasPedidas[3][0] = this._pricingObj.Cliente_Credito_Vista_Amex__c;
        this.taxasPedidas[3][1] = this._pricingObj.Cliente_Credito_2_a_6_Amex__c;
        this.taxasPedidas[3][2] = this._pricingObj.Cliente_Credito_7_a_12_Amex__c;
        // setando taxas pedidas RAV
        this.taxasPedidas[4][0] = this._pricingObj.Cliente_Taxa_Automatica__c;
        this.taxasPedidas[4][1] = this._pricingObj.Cliente_Taxa_Spot__c;
    }

    private populaMatrixNet() {
        // net- Visa/Master
        this.taxasNet[0][0] = this._pricingObj.API_NET_Total_Debit__c;
        this.taxasNet[0][1] = this._pricingObj.API_NET_Total_Credit__c;
        this.taxasNet[0][2] = this._pricingObj.API_NET_Total_Credit2x6__c;
        this.taxasNet[0][3] = this._pricingObj.API_NET_Total_Credit7x12__c;
        // net - Elo
        this.taxasNet[1][0] = this._pricingObj.API_Net_Debito_Elo__c;
        this.taxasNet[1][1] = this._pricingObj.API_Net_Credito_Elo__c;
        this.taxasNet[1][2] = this._pricingObj.API_Net_Credito_2x6_Elo__c;
        this.taxasNet[1][3] = this._pricingObj.API_Net_Credito_7x12_Elo__c;
        // net - Hiper
        this.taxasNet[2][0] = this._pricingObj.API_Net_Credito_Hiper__c;
        this.taxasNet[2][1] = this._pricingObj.API_Net_Credito_2x6_hiper__c;
        this.taxasNet[2][2] = this._pricingObj.API_Net_Credito_7x12_hiper__c;
        // net - Amex
        this.taxasNet[3][0] = this._pricingObj.API_Net_Credito_Amex__c;
        this.taxasNet[3][1] = this._pricingObj.API_Net_Credito_2x6_Amex__c;
        this.taxasNet[3][2] = this._pricingObj.API_Net_Credito_7x12_Amex__c;
        // net RAV
        this.taxasPedidas[4][0] = 0;
        this.taxasPedidas[4][1] = 0;
    }

    private populaBalizador() {
        // net- Visa/Master
        this.balizador[0][0] = this._pricingObj.balizador_debit_card_tax_master__c;
        this.balizador[0][1] = this._pricingObj.balizador_credit_card_tax_1x_master__c;
        this.balizador[0][2] = this._pricingObj.balizador_credit_card_tax_2x_master__c;
        this.balizador[0][3] = this._pricingObj.balizador_credit_card_tax_7x_master__c;
        // net - Elo
        this.balizador[1][0] = this._pricingObj.balizador_debit_card_tax_elo__c;
        this.balizador[1][1] = this._pricingObj.balizador_credit_card_tax_1x_elo__c;
        this.balizador[1][2] = this._pricingObj.balizador_credit_card_tax_2x_elo__c;
        this.balizador[1][3] = this._pricingObj.balizador_credit_card_tax_7x_elo__c;
        // net - Hiper
        this.balizador[2][0] = this._pricingObj.balizador_credit_card_tax_1x_hiper__c;
        this.balizador[2][1] = this._pricingObj.balizador_credit_card_tax_2x_hiper__c;
        this.balizador[2][2] = this._pricingObj.balizador_credit_card_tax_7x_hiper__c;
        // net - Amex
        this.balizador[3][0] = this._pricingObj.balizador_credit_card_tax_1x_amex__c;
        this.balizador[3][1] = this._pricingObj.balizador_credit_card_tax_2x_amex__c;
        this.balizador[3][2] = this._pricingObj.balizador_credit_card_tax_7x_amex__c;
        // net RAV
        this.balizador[4][0] = this._pricingObj.balizador_rav_tax_auto__c;
        this.balizador[4][1] = this._pricingObj.balizador_rav_tax_spot__c;
    }

    private verificaSeMudouAlgumaCondicao(): boolean {
        let flagMudou = false;
        this.populaMatrixTaxaOferecida();
        for (let i=0; i<this.taxasAtuais.length; i++) {
            for (let j=0; j<this.taxasAtuais[i].length; j++) {
                if (this.taxasAtuais[i][j] != this.taxasOferecidas[i][j]) {
                    // console.log(this.taxasAtuais[i][j] + ' != ' + this.taxasOferecidas[i][j]);
                    flagMudou = true;
                    break;
                }
            }
        }
        this.produtos.forEach(produto => {
            if (produto.Aluguel__c != produto.Atual_Aluguel__c) {
                // console.log('AAAAAAAAAAAAAAAAAHHHHHHHHH!');
                // console.log(produto.Aluguel__c + ' != ' + produto.Atual_Aluguel__c);
                flagMudou = true;
            }
            if (produto.Dias_de_Insecao__c) {
                // console.log('AAAAAAAAAAAAAAAAAHHHHHHHHH!');
                // console.log(produto.Dias_de_Insecao__c);
                flagMudou = true;
            }
        })
        return flagMudou;
    }

    contraProposta() {
        this.pricingObj.Pricing_Status__c = 'Novo';
        swal({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            type: 'info',
            title: 'Taxas editáveis para contra proposta'
        });
    }

    // a principio somente bandeiras, ja sabemos que tem ao menos duas colunas (!= novo)
    montaTabela(listaPricing: PricingObject[]) {
        // histórico desta proposta
        let propostaHis = new Array<PricingObject>();
        for (let i = listaPricing.length-1; i >= 0; i--) {
            propostaHis.push(listaPricing[i]);
            if (listaPricing[i].Pricing_Status__c === 'Novo') {
                break;
            }
        }

        console.log("Historico: ");
        console.log(propostaHis);

        // adicionando linhas e colunas à tabela
        let propostaAnterior = propostaHis.pop();

        
        console.log("propostaAnterior (pop):");
        console.log(propostaAnterior);

        let tabela = [];
        let linha = 0;
        let col = 0;
        let taxasPropostas = this.transformToArray(propostaAnterior);

        console.log("propostaAnterior taxas array:");
        console.log(taxasPropostas);

        // coluna inicial (taxa anterior)
        console.log("Front");
        console.log(this.estruturaPricing);
        for (let i=0; i<this.taxasAtuais.length; i++) {
            tabela[linha] = [];
            tabela[linha][0] = this.estruturaPricing[i].tituloPanel;
            for (let j=0; j<this.taxasAtuais[i].length; j++) {
                console.log("this.taxasAtuais[" + i + "][" + j + "]= " + this.taxasAtuais[i][j]);
                console.log("taxasPropostas[" + i + "][" + j + "]= " + taxasPropostas[i][j]);
                console.log("diff= " + (this.taxasAtuais[i][j] - taxasPropostas[i][j]));
                if (this.taxasAtuais[i][j] - taxasPropostas[i][j] != 0) {
                    tabela[linha][0] += ' ' + this.estruturaPricing[i].tituloSecoes[j];
                    tabela[linha][1] = this.taxasAtuais[i][j];
                    tabela[linha++][2] = taxasPropostas[i][j];
                }
            }
        }
        console.log("tabela");
        console.log(tabela);

        // while (propostaHis.length > 0) {
        //     let colunaDePricing = propostaHis.pop();
        //     let diferencas = this.calculaDifTaxas(propostaAnterior, colunaDePricing);
        //     for (let i=0; i<diferencas.length; i++) {
        //         for (let j=0; j<diferencas[i].length; j++) {
        //             if (diferencas[i][j] != 0) {
        //                 tabela[0] = this.estruturaPricing[i].tituloPanel;
        //                 linha[1] = diferencas[i][j];
        //             }
        //         }
        //     }
        // }
    }

    private calculaDifTaxas(pricing1: PricingObject, pricing2: PricingObject): number[][] {
        let diff1menos2 = []; 
        for (let i: number = 0; i < 5; i++) {
            diff1menos2[i] = [];
            for (let j: number = 0; j < 4; j++) {
                diff1menos2[i][j] = null;
            }
        }
        // setando taxas oferecidas - Visa/Master
        diff1menos2[0][0] = pricing1.Debito__c - pricing2.Debito__c;
        diff1menos2[0][1] = pricing1.Credito_a_Vista__c - pricing2.Credito_a_Vista__c;
        diff1menos2[0][2] = pricing1.Credito_2_a_6__c - pricing2.Credito_2_a_6__c;
        diff1menos2[0][3] = pricing1.Credito_7_a_12__c - pricing2.Credito_7_a_12__c;
        // setando taxas oferecidas - Elo
        diff1menos2[1][0] = pricing1.Debito_EloSub__c - pricing2.Debito_EloSub__c;
        diff1menos2[1][1] = pricing1.Credito_a_Vista_EloSub__c - pricing2.Credito_a_Vista_EloSub__c;
        diff1menos2[1][2] = pricing1.Credito_2_a_6_EloSub__c - pricing2.Credito_2_a_6_EloSub__c;
        diff1menos2[1][3] = pricing1.Credito_7_a_12_EloSub__c - pricing2.Credito_7_a_12_EloSub__c;
        // setando taxas oferecidas - Hiper
        diff1menos2[2][0] = pricing1.credito_a_vista_hiper__c - pricing2.credito_a_vista_hiper__c;
        diff1menos2[2][1] = pricing1.credito_2_a_6_hiper__c - pricing2.credito_2_a_6_hiper__c;
        diff1menos2[2][2] = pricing1.credito_7_a_12_hiper__c - pricing2.credito_7_a_12_hiper__c;
        // setando taxas oferecidas - Amex
        diff1menos2[3][0] = pricing1.Credito_Vista_Amex__c - pricing2.Credito_Vista_Amex__c;
        diff1menos2[3][1] = pricing1.Credito_2_a_6_Amex__c - pricing2.Credito_2_a_6_Amex__c;
        diff1menos2[3][2] = pricing1.Credito_7_a_12_Amex__c - pricing2.Credito_7_a_12_Amex__c;
        // setando taxas oferecidas RAV
        diff1menos2[4][0] = pricing1.Taxa_Automatica__c - pricing2.Taxa_Automatica__c;
        diff1menos2[4][1] = pricing1.Taxa_Spot__c - pricing2.Taxa_Spot__c;
        return diff1menos2;
    }

    private transformToArray(pricing: PricingObject): number[][] {
        let pricingArray = [];
        for (let i: number = 0; i < 5; i++) {
            pricingArray[i] = [];
            for (let j: number = 0; j < 4; j++) {
                pricingArray[i][j] = null;
            }
        }
        // setando taxas oferecidas - Visa/Master
        pricingArray[0][0] = pricing.Debito__c;
        pricingArray[0][1] = pricing.Credito_a_Vista__c;
        pricingArray[0][2] = pricing.Credito_2_a_6__c;
        pricingArray[0][3] = pricing.Credito_7_a_12__c;
        //Elo
        pricingArray[1][0] = pricing.Debito_EloSub__c;
        pricingArray[1][1] = pricing.Credito_a_Vista_EloSub__c;
        pricingArray[1][2] = pricing.Credito_2_a_6_EloSub__c;
        pricingArray[1][3] = pricing.Credito_7_a_12_EloSub__c;
        //Hiper
        pricingArray[2][0] = pricing.credito_a_vista_hiper__c;
        pricingArray[2][1] = pricing.credito_2_a_6_hiper__c;
        pricingArray[2][2] = pricing.credito_7_a_12_hiper__c;
        //Amex
        pricingArray[3][0] = pricing.Credito_Vista_Amex__c;
        pricingArray[3][1] = pricing.Credito_2_a_6_Amex__c;
        pricingArray[3][2] = pricing.Credito_7_a_12_Amex__c;
        //RAV
        pricingArray[4][0] = pricing.Taxa_Automatica__c;
        pricingArray[4][1] = pricing.Taxa_Spot__c;
        return pricingArray;
    }
}
