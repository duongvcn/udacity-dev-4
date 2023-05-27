import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'

const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS);

const s3 = new XAWS.S3({
    signatureVersion: 'v4'
});

const logger = createLogger('AttachmentUtils');
// TODO: Implement the fileStogare logic
export class AttachmentUtils {

    constructor(
        private readonly todosTable: any = process.env.TODOS_TABLE,
        private readonly bucketName: any = process.env.ATTACHMENT_S3_BUCKET,
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION,
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient()) {
    }
    
    async generateUploadUrl(todoId: string, imageId: string): Promise<string> {
        logger.info('generateUploadUrl', { "todoId": todoId , "imageId": imageId});
        const params = {
            TableName: this.todosTable,
            Key: {
                todoId: todoId
            },
            UpdateExpression: 'SET #attachmentUrl =:url',
            ExpressionAttributeNames: { "#attachmentUrl": "attachmentUrl" },
            ExpressionAttributeValues: { ":url": `https://${this.bucketName}.s3.amazonaws.com/${imageId}` },
            ReturnValues: 'UPDATED_NEW'
        };
    
        await this.docClient.update(params).promise();
        const url = this.getUploadUrl(imageId);
        return url;
    }

    async getUploadUrl(imageId: string) {
        return s3.getSignedUrl('putObject', {
            Bucket: this.bucketName,
            Key: imageId,
            Expires: this.urlExpiration
        })
    }

}