import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";

export class ProductServiceAwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsList = new NodejsFunction(this, "GetProductsList", {
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(
        __dirname,
        "..",
        "lambda",
        "handlers",
        "getProductsList.ts"
      ),
      handler: "handler",
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    const getProductsById = new NodejsFunction(this, "GetProductsById", {
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(
        __dirname,
        "..",
        "lambda",
        "handlers",
        "getProductsById.ts"
      ),
      handler: "handler",
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    const httpApi = new apigwv2.HttpApi(this, "ProductHttpApi", {
      apiName: `${this.stackName}-product-api`,
      description: "Task 3 product list and by-id",
      corsPreflight: {
        allowHeaders: ["Content-Type"],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ["*"],
        maxAge: cdk.Duration.days(1),
      },
      createDefaultStage: true,
    });

    httpApi.addRoutes({
      path: "/products",
      methods: [apigwv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "ProductsListIntegration",
        getProductsList
      ),
    });

    httpApi.addRoutes({
      path: "/products/{productId}",
      methods: [apigwv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "ProductByIdIntegration",
        getProductsById
      ),
    });

    new cdk.CfnOutput(this, "ProductHttpApiUrl", {
      description: "Base URL for the product HTTP API",
      value: httpApi.apiEndpoint,
      exportName: `${this.stackName}-HttpApiUrl`,
    });
  }
}
