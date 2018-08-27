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
import {User} from '../model/User';

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
                // Initialize/create tables
                await Promise.all([
                    // Just insert new models here...
                    await schema.createTable(new User()),
                ]);
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
            // .find() is required to check if there are existing records of the same primary key
            await userModel.find(user.uuid);
            
            userModel.getField('uuid').setFieldValue(user.uuid);
            userModel.getField('first_name').setFieldValue(user.firstName);
            userModel.getField('last_name').setFieldValue(user.lastName);
            userModel.getField('occupation').setFieldValue(user.occupation);
            
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
  * Get all records:
```javascript
    userModel.all()
        .then(function(results){
            console.log(results.status) //returns 200 if successful
            console.log(results.message) // returns status message 
            console.log(results.data) // array of results, this are the entries from the database
        })
        .catch((err) => console.log(err))
```
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
        
### Troubleshooting
**Error:** Table column does not exist

**Occurrence:** Creating/Inserting new records on the database

**Possible Causes:** You modified the structure of the model by renaming columns or adding new ones. This happens because SQLite storage creates an internal copy of the database, which does not change even if you delete the existing database on `android/app/src/main/assets/www`

**Solution:** 
1. Create a function that will delete the database
```javascript
export default function deleteDB(){
    var SQLite = require('react-native-sqlite-storage')
    var db = SQLite.deleteDatabase({name : 'yourDatabase.db', location : 'default'})
    console.log(db)
}
```
2. Run on startup. If the problem is solved, comment the function to avoid deletion of the current database.

---------------------------------------------------------------

**Error:** TypeError: Cannot read property 'transaction' of null

**Occurrence:** Reading records from the database (either using .find() or .where())

**Possible Causes:** The instance of the database either expired/timeout or the database wasn't initialize at the time of retrieving records. This is most likely due to the async property of the functions, so the connection isn't guaranteed to be open immediately.

**Solution:** 
Initialize an instance of the database on the same function calling .find() or .where()
```javascript
import {Schema} from 'react-native-orm';
import {User} from '../model/User';

function checkExistingMainUser(){
    return new Promise(async (resolve, reject) => {
        const schema = new Schema({
            databaseName: 'yourDatabase.db'
        });
        try {
            //Open database
            const schemaRes = await schema.open();

            if (schemaRes.statusCode === 200) {
                global.dbInstance = schemaRes.data;
                await Promise.all([
                    await schema.createTable(new User()),
                ]);

                const userModel = new User({ dbInstance: global.dbInstance });
                console.log("Checking for existing Main User..")
                userModel.find('main', 'type')
                    .then(function(result){
                        console.log(result)
                    })
                    .catch((err) => console.log(err))

                return resolve('Main User found');
            }
          } 
        catch (err) {
              return reject(err.message);
          }
      });
}

export default checkExistingMainUser;
```

