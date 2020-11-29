import config from '../config/app-config.json';
import mariadb from 'mariadb';
import {get_date_time} from '../util/misc';

class DBHelper {
    private static instance: DBHelper;
    db_pool: mariadb.Pool;
    private constructor() {

        // init database connection
        const db_addr = config.db.db_addr;
        const db_port = config.db.db_port;
        const db_user = config.db.db_user;
        const db_pwd = config.db.db_pwd;
        const db_name = config.db.db_name;
        this.db_pool = mariadb.createPool({
            host: db_addr,
            port: db_port, 
            user: db_user,
            password: db_pwd,
            database: db_name,
            connectionLimit: 100,
            timezone: 'Etc/GMT0'});
    }

    public static get_instance() {
        if (!DBHelper.instance) {
            DBHelper.instance = new DBHelper();
        }

        return DBHelper.instance;
    }

    public static close_db_conn() {
        if (!DBHelper.instance) {
            return;
        }

        const db_pool = DBHelper.get_instance().db_pool;

        db_pool.end()
            .catch(err => {
                console.error('cannot end the connection due to error: ' + err);
            });
    }
    
    public static query(sql_cmd: string, values?: Array<any>) {
        const db_pool = DBHelper.get_instance().db_pool;
        return db_pool.getConnection()
            .then(conn => {
                const ret = conn.query(sql_cmd, values)
                    .then(result => {
                        return { result: result, success: true};
                    })
                    .catch(err => {
                        return { result: err, success: false};
                    });

                conn.release();
                
                return ret;
            })
            .catch(err => {
                return { result: err, success: false};
            });
    }
}

export default DBHelper;