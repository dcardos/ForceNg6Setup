import { Injectable } from "@angular/core";
import { Observable } from "../../node_modules/rxjs";
import { PricingObject, Produto } from "./SalesforceObjs";

declare var getSfApiWrapper : () => DataApi;

//Response information
export interface ApiStatus {
    statusCode: number;
    status: boolean;
    code: string;
    message: string;
    method?: string;
}

//Callback function for the API call
export interface ApiHandler<T> {
    (response: T, status: ApiStatus);
}

//Config options for making api call.
export interface CallConfiguration { buffer: boolean, escape: boolean, timeout: number }

const DEFAULT_CONFIG: CallConfiguration = { buffer: true, escape: false, timeout: 30000 };

//Interface of the JS wrapper provided by Salesforce
export interface DataApi {
    getAllPricingObjectFromAccount(accId: string, callback: ApiHandler<PricingObject[]>, configuration : CallConfiguration) : void;
    getAllProdutosFromPricing(accId: string, callback: ApiHandler<Produto[]>, configuration: CallConfiguration)
}


class ApiObservableBuilder<T> {
    
      constructor() {
      }
    
      observer: any;
    
      private handleResponse(resp: T, status: ApiStatus) {

        if (!(status.statusCode >= 200 && status.statusCode <= 302)) {
            this.observer.error("Error response from api: " + status.statusCode + " " + JSON.stringify(status));
        } else {
            let result : any = resp;
            if (typeof result === 'string') {
              try {
                //Server response may be well defined but the wrapper may not automatically 
                //json parse all response types.
                result = JSON.parse(result);
              } catch (e) {
    
              }
            }
            this.observer.next(result);
            this.observer.complete();
        }
      }
    
      public getResponseHandler() : (resp: T, status: ApiStatus) => void {
        return this.handleResponse.bind(this);
      }
      
      public build(apiCall : () => void) : Observable<T> {
        let builder = this;
        let observable : Observable<T> = Observable.create(function(observer) {
          builder.observer = observer;
    
          apiCall();
        });
        return observable;
      }
}
    
    
@Injectable()
export class SalesforceApiService {

    private getCallBuilder<T>() : ApiObservableBuilder<T> {
        return new ApiObservableBuilder<T>();
    }

    public getAllPricingObjectFromAccount(accId: string) : Observable<PricingObject[]> {
        let api = getSfApiWrapper();
        let builder = this.getCallBuilder<PricingObject[]>();
        return builder.build(() => api.getAllPricingObjectFromAccount(accId, builder.getResponseHandler(), DEFAULT_CONFIG));
    }

    public getAllProdutosFromPricing(accId: string) : Observable<Produto[]> {
        let api = getSfApiWrapper();
        let builder = this.getCallBuilder<Produto[]>();
        return builder.build(() => api.getAllProdutosFromPricing(accId, builder.getResponseHandler(), DEFAULT_CONFIG));
    }
}
