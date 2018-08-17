export class FrontPricing {
    tituloPanel: string;
    tituloSecoes: string[];

    constructor(titulo: string, subtitulos: string[]) {
        this.tituloPanel = titulo;
        this.tituloSecoes = subtitulos;
    }
}

export class PricingObject {
    API_Tem_Alcada__c: boolean;
    Account__c: string;
    Aceita_Amex__c: boolean;
    Aceita_EloSub__c: boolean;
    Antecipacao_Automatica__c: boolean;
    Atual_Credito_2_a_6_Amex__c: number;
    Atual_Credito_2_a_6_EloSub__c: number;
    Atual_Credito_2_a_6__c: number;
    Atual_Credito_7_a_12_Amex__c: number;
    Atual_Credito_7_a_12_EloSub__c: number;
    Atual_Credito_7_a_12__c: number;
    Atual_Credito_Vista_Amex__c: number;
    Atual_Credito_a_Vista_EloSub__c: number;
    Atual_Credito_a_Vista__c: number;
    Atual_Debito_EloSub__c: number;
    Atual_Debito__c: number;
    Atual_Taxa_Automatica__c: number;
    Atual_Taxa_Spot__c: number;
    Atual_credito_2_a_6_hiper__c: number;
    Atual_credito_7_a_12_hiper__c: number;
    Atual_credito_a_vista_hiper__c: number;
    CreatedById: string;
    CreatedDate: number;
    Credito_2_a_6_Amex__c: number;
    Credito_2_a_6_EloSub__c: number;
    Credito_2_a_6__c: number;
    Credito_7_a_12_Amex__c: number;
    Credito_7_a_12_EloSub__c: number;
    Credito_7_a_12__c: number;
    Credito_Vista_Amex__c: number;
    Credito_a_Vista_EloSub__c: number;
    Credito_a_Vista__c: number;
    Debito_EloSub__c: number;
    Debito__c: number;
    email_aprovador__c: string;
    Id: string;
    OwnerId: string;
    Pode_Simular_Pricing__c: boolean;
    Pricing_Status__c: string;
    RecordTypeId: string;
    Taxa_Automatica__c: number;
    Taxa_Spot__c: number;
    aceita_hiper__c: boolean;
    credito_2_a_6_hiper__c: number;
    credito_7_a_12_hiper__c: number;
    credito_a_vista_hiper__c: number;
    share_de_credito_2_x_6__c: number;
    share_de_credito_7_x_12__c: number;
    share_de_credito__c: number;
    share_de_debito__c: number;
    tpvAlterado__c: boolean;
}

export class Produto {
    Account__c: string;
    Aluguel__c: number;
    Ativo_Stone__c: boolean;
    Atual_Aluguel__c: number;
    Atual_Dias_de_Insecao__c: number;
    Data_Inicio_Isencao__c: number;
    Dias_de_Insecao__c: number;
    Id: string;
    Meio_de_Captura__c: string;
    Name: string;
    Origem_Instala__c: boolean;
    OwnerId: string;
    Quantidade__c: number;
    RecordTypeId: string;
    Tecnologia__c: string;
    captureMethodId__c: string;
    modelId__c: string;
    serialNumber__c: string;
    statusId__c: string;
    technologyTypeId__c: string;
    terminalId__c: string;
    typeCapId__c: string;
}

export class AccountSF {
    ExpectedTPV__c: number;
    Quantidade_de_Lojas__c: number;
}