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

    async generateUploadUrl(userId: string, todoId: string): Promise<void> {
        logger.info(`Updating a todo item: ${todoId}`);
        await this.docClient
            .update({
                TableName: this.todosTable,
                Key: {
                    "userId": userId,
                    "todoId": todoId
                },
                UpdateExpression: "set #attachmentUrl = :attachmentUrl",
                ExpressionAttributeNames: { "#attachmentUrl": "attachmentUrl"},
                ExpressionAttributeValues: {":attachmentUrl": `https://${this.bucketName}.s3.amazonaws.com/${todoId}`},
                ReturnValues: 'UPDATED_NEW'
            })
            .promise();
    }

    async getUploadUrl(imageId: string) {
        return s3.getSignedUrl('putObject', {
            Bucket: this.bucketName,
            Key: imageId,
            Expires: this.urlExpiration
        })
    }

}