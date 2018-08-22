# react-native-orm
ORM for React Native.

It uses [Laravel](https://laravel.com/)-like approach and syntax ([Eloquent](https://laravel.com/docs/5.6/eloquent) and [Query Builder](https://laravel.com/docs/5.6/queries)). It uses  *SQLite* storage by default.

### Installation:
react-native-orm uses [react-native-sqlite-storage](https://github.com/andpor/react-native-sqlite-storage) to interact to SQLite database so you should install it first.

Yarn:
```
yarn add git+https://github.com/whizdummy/react-native-orm#master
```

NPM:
```
npm install --save git+https://github.com/whizdummy/react-native-orm#master
```

### Example:
https://github.com/whizdummy/react-native-orm-sample


### Usage:
1. Open and initialize and instance of the database.
```javascript
import {Schema} from 'react-native-orm';

function openDatabase(){
    return new Promise(async (resolve, reject) => {
        // For android, the database will be placed in /android/app/src/main/assets/www/
        const schema = new Schema({
            databaseName: 'yourDatabase.db'
        });

        try {
            // Open database
            const schemaRes = await schema.open();

            if (schemaRes.statusCode === 200) {
                // If successful, set the database instance to global for easy referencing 
                global.dbInstance = schemaRes.data;
                return resolve(schemaRes.message);
            }
        } catch (err) {
            console.error('openDatabase error:', err.message);

            return reject(err.message);
        }
    });
}

export default openDatabase;
```

2. Create a model (to be used as table)
```javascript
import { Model } from "react-native-orm";

export class User extends Model {
    constructor(props = {}) {
        super({
            dbInstance: props.dbInstance || null,
            tableName: 'User',
            tableFields: {
                uuid:       'string|primary',
                first_name: 'string',
                last_name:  'string',
                occupation:   'string'
            },
            assignableFields: [
                'uuid',
                'first_name',
                'last_name',
                'occupation'
            ]
        });
        
        
}
```

3. Create/update new records in the table
```javascript
import { User } from '../model/User';

const user = {
  uuid: '7a39da50-2b66-47be-8d99-3f074c525b70',
  firstName: 'John',
  lastName: 'Smith',
  occupation: 'Software Engineer'
 }

function createUser(user){
    return new Promise(async (resolve, reject) => {
        try {
            const userModel = new User({ dbInstance: global.dbInstance });
            
            // Create record
            // To update an existing record, use the find function to filter out records
            // Example: await userModel.find('7a39da50-2b66-47be-8d99-3f074c525b70');
            
            userModel.getField('uuid').setField(user.uuid);
            userModel.getField('first_name').setField(user.firstName);
            userModel.getField('last_name').setField(user.lastName);
            userModel.getField('occupation').setField(user.occupation);
            
            // See https://github.com/whizdummy/react-native-orm-sample/tree/develop 
            // for using a for-loop to fill in the fields

            await userModel.save();

            return resolve('User created');
          } 
        catch (err) {
              return reject(err.message);
          }
      });
}
export default createUser;
```

4. Read records of the table
  * Get all records: `` userModel.all()``
  * Get first record: `` userModel.first()``
  * Get a specific record (Use this for searching an entry by its primary key, otherwise it would only return the first entry)
      * Not including deleted  
          * e.g. search by UUID: ``userModel.find('7a39da50-2b66-47be-8d99-3f074c525b70')``
          * e.g. search by first name ``userModel.find('John', 'first_name')``
      * Including deleted 
          * ``userModel.findWithTrashed('7a39da50-2b66-47be-8d99-3f074c525b70')``
          * ``userModel.findWithTrashed('John', 'first_name')``
  * Get specific records 
      * ``await userModel.where('first_name', '=', 'John').get();``
        or
      * ``userModel.where('first_name', '=', 'John').get().then(...).catch(...);``
 
5. Delete records 
    * Soft delete
        ```javascript
         await userModel.find('7a39da50-2b66-47be-8d99-3f074c525b70');
         await userModel.remove(true);
        ```
    * Hard delete
        ```javascript
         await userModel.find('7a39da50-2b66-47be-8d99-3f074c525b70');
         await userModel.remove();
        ```


**TODO:**
* [x] Example
* [ ] API Documentation
* [ ] Publish to npm
* [ ] Changelog
