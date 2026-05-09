import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";

const lambdaEnv = (
  productsTableName: string,
  stocksTableName: string
): Record<string, string> => ({
  PRODUCTS_TABLE_NAME: productsTableName,
  STOCKS_TABLE_NAME: stocksTableName,
  AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
});

export class ProductServiceAwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTableName =
      (this.node.tryGetContext("productsTableName") as string | undefined) ??
      "products";
    const stocksTableName =
      (this.node.tryGetContext("stocksTableName") as string | undefined) ??
      "stocks";

    const productsTable = dynamodb.Table.fromTableName(
      this,
      "ProductsTable",
      productsTableName
    );
    const stocksTable = dynamodb.Table.fromTableName(
      this,
      "StocksTable",
      stocksTableName
    );

    const sharedEnv = lambdaEnv(productsTableName, stocksTableName);

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
      environment: sharedEnv,
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
      environment: sharedEnv,
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    const createProduct = new NodejsFunction(this, "CreateProduct", {
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(
        __dirname,
        "..",
        "lambda",
        "handlers",
        "createProduct.ts"
      ),
      handler: "handler",
      environment: sharedEnv,
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    productsTable.grantReadData(getProductsList);
    stocksTable.grantReadData(getProductsList);
    productsTable.grantReadData(getProductsById);
    stocksTable.grantReadData(getProductsById);
    productsTable.grantReadWriteData(createProduct);
    stocksTable.grantReadWriteData(createProduct);

    const httpApi = new apigwv2.HttpApi(this, "ProductHttpApi", {
      apiName: `${this.stackName}-product-api`,
      description: "Product service: DynamoDB-backed products and stocks",
      corsPreflight: {
        allowHeaders: ["Content-Type"],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
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

    httpApi.addRoutes({
      path: "/products",
      methods: [apigwv2.HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "CreateProductIntegration",
        createProduct
      ),
    });

    new cdk.CfnOutput(this, "ProductHttpApiUrl", {
      description: "Base URL for the product HTTP API",
      value: httpApi.apiEndpoint,
      exportName: `${this.stackName}-HttpApiUrl`,
    });
  }
}
