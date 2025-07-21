const { Client } = require('pg');
const readline = require('readline');
const fs = require('fs').promises;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'meat_planner',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

class LocalStorageMigrator {
  constructor() {
    this.client = new Client(dbConfig);
    this.adminUserId = null;
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Connected to database');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error.message);
      throw error;
    }
  }

  async disconnect() {
    await this.client.end();
    console.log('Disconnected from database');
  }

  async createAdminUser() {
    try {
      // Check if admin user exists
      const result = await this.client.query(
        "SELECT id FROM users WHERE username = 'admin'"
      );

      if (result.rows.length > 0) {
        this.adminUserId = result.rows[0].id;
        console.log('✅ Admin user already exists');
        return;
      }

      // Create admin user
      const insertResult = await this.client.query(
        `INSERT INTO users (username, email, password_hash, role) 
         VALUES ('admin', 'admin@agp.local', '$2b$10$YourHashedPasswordHere', 'admin')
         RETURNING id`
      );
      
      this.adminUserId = insertResult.rows[0].id;
      console.log('✅ Created admin user');
    } catch (error) {
      console.error('❌ Failed to create admin user:', error.message);
      throw error;
    }
  }

  parseLocalStorageData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return {
        planningData: data.planningData || {},
        productionComments: data.productionComments || {},
        disabledDates: data.disabledDates || [],
        workerAvailability: data.workerAvailability || {}
      };
    } catch (error) {
      console.error('❌ Failed to parse localStorage data:', error.message);
      return null;
    }
  }

  async migrateProducts() {
    console.log('\n📦 Migrating products...');
    
    // Default products from the original app
    const defaultProducts = [
      { article: 'K12', name: 'Klasična klobasa', color: '#FF6B6B' },
      { article: 'K34', name: 'Kranjska klobasa', color: '#4ECDC4' },
      { article: 'P56', name: 'Pečenica', color: '#45B7D1' },
      { article: 'S78', name: 'Šunka', color: '#F7DC6F' },
      { article: 'M90', name: 'Mortadela', color: '#BB8FCE' },
      { article: 'H12', name: 'Hrenovka', color: '#85C1E2' },
      { article: 'B34', name: 'Bučna salama', color: '#F8C471' },
      { article: 'Z56', name: 'Zimska salama', color: '#A3E4D7' },
      { article: 'P78', name: 'Pršut', color: '#F1948A' },
      { article: 'L90', name: 'Lovska salama', color: '#D7BDE2' },
      { article: 'K11', name: 'Krainer', color: '#AED6F1' },
      { article: 'S22', name: 'Suha salama', color: '#FAD7A0' }
    ];

    for (const product of defaultProducts) {
      try {
        await this.client.query(
          `INSERT INTO products (article_number, name, color, unit, created_by) 
           VALUES ($1, $2, $3, 'kg', $4)
           ON CONFLICT (article_number) DO UPDATE 
           SET name = EXCLUDED.name, color = EXCLUDED.color`,
          [product.article, product.name, product.color, this.adminUserId]
        );
      } catch (error) {
        console.error(`Failed to migrate product ${product.article}:`, error.message);
      }
    }

    console.log('✅ Products migrated');
  }

  async migrateCustomers() {
    console.log('\n👥 Migrating customers...');
    
    // Default customers from the original app
    const defaultCustomers = [
      { name: 'Mercator', color: '#3B82F6' },
      { name: 'Spar', color: '#10B981' },
      { name: 'Lidl', color: '#F59E0B' },
      { name: 'Hofer', color: '#EF4444' },
      { name: 'Tuš', color: '#8B5CF6' },
      { name: 'Leclerc', color: '#EC4899' }
    ];

    for (const customer of defaultCustomers) {
      try {
        await this.client.query(
          `INSERT INTO customers (name, color, created_by) 
           VALUES ($1, $2, $3)
           ON CONFLICT (name) DO UPDATE 
           SET color = EXCLUDED.color`,
          [customer.name, customer.color, this.adminUserId]
        );
      } catch (error) {
        console.error(`Failed to migrate customer ${customer.name}:`, error.message);
      }
    }

    console.log('✅ Customers migrated');
  }

  async migrateWorkers() {
    console.log('\n👷 Migrating workers...');
    
    // Default workers list
    const workerNames = [
      'Ana Novak', 'Marko Kovač', 'Petra Zajc', 'Luka Vidmar',
      'Nina Potočnik', 'Matej Mlakar', 'Sara Kralj', 'Žan Zupančič'
    ];

    for (const name of workerNames) {
      try {
        await this.client.query(
          `INSERT INTO workers (name, active, created_by) 
           VALUES ($1, true, $2)
           ON CONFLICT (name) DO NOTHING`,
          [name, this.adminUserId]
        );
      } catch (error) {
        console.error(`Failed to migrate worker ${name}:`, error.message);
      }
    }

    console.log('✅ Workers migrated');
  }

  async migratePlanningData(data) {
    console.log('\n📅 Migrating planning data...');
    
    if (!data.planningData || Object.keys(data.planningData).length === 0) {
      console.log('No planning data found');
      return;
    }

    let migrated = 0;
    let failed = 0;

    // Get product and customer mappings
    const products = await this.client.query('SELECT id, article_number FROM products');
    const customers = await this.client.query('SELECT id, name FROM customers');
    
    const productMap = {};
    products.rows.forEach(p => { productMap[p.article_number] = p.id; });
    
    const customerMap = {};
    customers.rows.forEach(c => { customerMap[c.name] = c.id; });

    for (const [dateKey, dateData] of Object.entries(data.planningData)) {
      const [year, month, day] = dateKey.split('-').map(Number);
      const planDate = new Date(year, month - 1, day);

      // Sales data
      if (dateData.sales) {
        for (const [productArticle, productData] of Object.entries(dateData.sales)) {
          const productId = productMap[productArticle];
          if (!productId) continue;

          for (const [customerName, quantity] of Object.entries(productData)) {
            if (customerName === 'total') continue;
            
            const customerId = customerMap[customerName];
            if (!customerId) continue;

            try {
              await this.client.query(
                `INSERT INTO planning_data (
                  product_id, customer_id, plan_date, data_type, 
                  quantity, created_by
                ) VALUES ($1, $2, $3, 'sales_plan', $4, $5)
                ON CONFLICT (product_id, customer_id, plan_date, data_type, version)
                DO UPDATE SET quantity = EXCLUDED.quantity`,
                [productId, customerId, planDate, quantity, this.adminUserId]
              );
              migrated++;
            } catch (error) {
              failed++;
            }
          }
        }
      }

      // Production data
      if (dateData.production) {
        for (const [productArticle, quantity] of Object.entries(dateData.production)) {
          if (productArticle === 'total') continue;
          
          const productId = productMap[productArticle];
          if (!productId) continue;

          try {
            await this.client.query(
              `INSERT INTO planning_data (
                product_id, customer_id, plan_date, data_type, 
                quantity, created_by
              ) VALUES ($1, NULL, $2, 'production_plan', $3, $4)
              ON CONFLICT (product_id, customer_id, plan_date, data_type, version)
              DO UPDATE SET quantity = EXCLUDED.quantity`,
              [productId, planDate, quantity, this.adminUserId]
            );
            migrated++;
          } catch (error) {
            failed++;
          }
        }
      }
    }

    console.log(`✅ Planning data migrated: ${migrated} records (${failed} failed)`);
  }

  async migrateProductionCalendar(data) {
    console.log('\n📆 Migrating production calendar...');
    
    if (!data.disabledDates || data.disabledDates.length === 0) {
      console.log('No disabled dates found');
      return;
    }

    for (const dateKey of data.disabledDates) {
      const [year, month, day] = dateKey.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      try {
        await this.client.query(
          `INSERT INTO production_calendar (date, is_production_day, created_by)
           VALUES ($1, false, $2)
           ON CONFLICT (date) DO UPDATE 
           SET is_production_day = false`,
          [date, this.adminUserId]
        );
      } catch (error) {
        console.error(`Failed to migrate calendar date ${dateKey}:`, error.message);
      }
    }

    console.log('✅ Production calendar migrated');
  }

  async migrateWorkerAvailability(data) {
    console.log('\n🏖️ Migrating worker availability...');
    
    if (!data.workerAvailability || Object.keys(data.workerAvailability).length === 0) {
      console.log('No worker availability data found');
      return;
    }

    // Get worker mappings
    const workers = await this.client.query('SELECT id, name FROM workers');
    const workerMap = {};
    workers.rows.forEach(w => { workerMap[w.name] = w.id; });

    let migrated = 0;

    for (const [workerName, dates] of Object.entries(data.workerAvailability)) {
      const workerId = workerMap[workerName];
      if (!workerId) continue;

      for (const [dateKey, available] of Object.entries(dates)) {
        const [year, month, day] = dateKey.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        try {
          await this.client.query(
            `INSERT INTO worker_availability (
              worker_id, date, available, absence_type, created_by
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (worker_id, date) DO UPDATE 
            SET available = EXCLUDED.available`,
            [workerId, date, available, available ? null : 'vacation', this.adminUserId]
          );
          migrated++;
        } catch (error) {
          console.error(`Failed to migrate availability for ${workerName} on ${dateKey}`);
        }
      }
    }

    console.log(`✅ Worker availability migrated: ${migrated} records`);
  }

  async migrateProductionComments(data) {
    console.log('\n💬 Migrating production comments...');
    
    if (!data.productionComments || Object.keys(data.productionComments).length === 0) {
      console.log('No production comments found');
      return;
    }

    for (const [dateKey, comment] of Object.entries(data.productionComments)) {
      if (!comment || comment.trim() === '') continue;

      const [year, month, day] = dateKey.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      try {
        // Store as a general production note (not tied to specific product)
        await this.client.query(
          `INSERT INTO production_notes (date, note, created_by)
           VALUES ($1, $2, $3)
           ON CONFLICT (date) DO UPDATE 
           SET note = EXCLUDED.note`,
          [date, comment, this.adminUserId]
        );
      } catch (error) {
        console.error(`Failed to migrate comment for ${dateKey}:`, error.message);
      }
    }

    console.log('✅ Production comments migrated');
  }

  async run() {
    try {
      // Connect to database
      await this.connect();

      // Create admin user
      await this.createAdminUser();

      // Ask user for localStorage data
      console.log('\n📋 Please export your localStorage data from the browser:');
      console.log('1. Open the production planner in your browser');
      console.log('2. Open Developer Tools (F12)');
      console.log('3. Go to Console tab');
      console.log('4. Run this command: copy(JSON.stringify(localStorage))');
      console.log('5. Paste the copied data into a file called "localstorage-export.json"');
      console.log('6. Press Enter when ready...\n');

      await question('Press Enter to continue...');

      // Read localStorage data
      let localStorageData;
      try {
        const fileContent = await fs.readFile('localstorage-export.json', 'utf8');
        const allData = JSON.parse(fileContent);
        
        // Extract meat planner data
        localStorageData = this.parseLocalStorageData(
          allData['meatPlannerData'] || allData['planningData'] || '{}'
        );
        
        if (!localStorageData) {
          throw new Error('Invalid localStorage data format');
        }
      } catch (error) {
        console.error('❌ Failed to read localStorage data:', error.message);
        console.log('\nAlternatively, you can manually paste the data:');
        const pastedData = await question('Paste localStorage data (or press Enter to skip): ');
        
        if (pastedData) {
          localStorageData = this.parseLocalStorageData(pastedData);
        } else {
          localStorageData = {
            planningData: {},
            productionComments: {},
            disabledDates: [],
            workerAvailability: {}
          };
        }
      }

      // Run migrations
      await this.migrateProducts();
      await this.migrateCustomers();
      await this.migrateWorkers();
      await this.migratePlanningData(localStorageData);
      await this.migrateProductionCalendar(localStorageData);
      await this.migrateWorkerAvailability(localStorageData);
      await this.migrateProductionComments(localStorageData);

      console.log('\n✅ Migration completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Update the admin user password in the database');
      console.log('2. Start the backend server: cd backend && npm start');
      console.log('3. Start the frontend: cd frontend && npm start');
      console.log('4. Login with admin credentials and verify the migrated data');

    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
    } finally {
      await this.disconnect();
      rl.close();
    }
  }
}

// Add production_notes table if it doesn't exist
const createProductionNotesTable = `
CREATE TABLE IF NOT EXISTS production_notes (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  note TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// Run migration
const migrator = new LocalStorageMigrator();

// First create the production_notes table
(async () => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    await client.query(createProductionNotesTable);
    console.log('✅ Ensured production_notes table exists');
  } catch (error) {
    console.error('Failed to create production_notes table:', error.message);
  } finally {
    await client.end();
  }

  // Then run the migration
  await migrator.run();
})();