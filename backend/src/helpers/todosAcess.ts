import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';


const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

export class TodosAccess {

    constructor(
        private readonly todosTable: any = process.env.TODOS_TABLE,
        private readonly docClient: DocumentClient = createDynamoDBClient()) {
    }

    async getTodosForUser(userId: string): Promise<TodoItem[] | PromiseLike<TodoItem[]>> {
        logger.info('Getting todos for user', { "userId": userId });
        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': userId
            },
            ScanIndexForward: false
          }).promise()
          const items = result.Items
          return items as TodoItem[]
    }

    async createTodo(todoItem: TodoItem): Promise<TodoItem> {
        logger.info('Creating new todo item', {...todoItem });
        await this.docClient
            .put({
                TableName: this.todosTable,
                Item: todoItem
            })
            .promise();
        return todoItem;
    }

    async updateTodo(userId: string, todoId: string, updateData: TodoUpdate): Promise<void> {
        logger.info(`Updating a todo item: ${todoId}`);
        await this.docClient
            .update({
                TableName: this.todosTable,
                Key: { userId, todoId },
                ConditionExpression: 'attribute_exists(todoId)',
                UpdateExpression: 'set #n = :name, dueDate = :due, done = :done',
                ExpressionAttributeNames: { '#n': 'name' },
                ExpressionAttributeValues: {
                    ':name': updateData.name,
                    ':due': updateData.dueDate,
                    ':done': updateData.done
                }
            })
            .promise();
    }

    async deleteTodo(userId: string, todoId: string) {
        logger.info(`deleting a todo item: ${todoId}`);
        await this.docClient
            .delete({
                TableName: this.todosTable,
                Key: { "userId": userId, "todoId": todoId },
            })
            .promise();
    }

    async createAttachmentPresignedUrl(userId: string, todoId: string) {
        logger.info(`create attachment a todo item: ${todoId}`);
        await this.docClient
            .delete({
                TableName: this.todosTable,
                Key: { "userId": userId, "todoId": todoId },
            })
            .promise();
    }

}
function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
      console.log('Creating a local DynamoDB instance')
      return new XAWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
      })
    }
  
    return new XAWS.DynamoDB.DocumentClient()
  }