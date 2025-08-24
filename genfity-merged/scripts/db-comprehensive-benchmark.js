const { performance } = require('perf_hooks');
const { Pool } = require('pg');

// Database configurations
const databases = {
  'Local Docker': {
    url: 'postgresql://genfity:genfitydbpassword@localhost:5432/genfity_app',
    location: 'Local Machine',
    tier: 'Development'
  },
  'Prisma Cloud': {
    url: 'postgresql://dadbe47d3376a5e8c15cf92977bde23b4e0319c1faa4bfdf5be16157fa053115:sk_yh2UBmu5QLwXGZfj9oRm1@db.prisma.io:5432/genfity-app',
    location: 'Global CDN',
    tier: 'Production (Fast)'
  },
  'Heroku EU': {
    url: 'postgres://ua12uagnbfurf7:p205c0d8b6bb0b789cd01243b7b1936664cb1320e208257da0487e71047d03d27@cepejvghn9noue.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com:5432/duud7ov6kdjni',
    location: 'Europe West',
    tier: 'Production (Slow)'
  },
  'Heroku US': {
    url: 'postgres://uded3c0q97dssl:p0c62e96966d7316fbdffaf421861be430428fb3ce6b0bd122222df09f7a3b6c7@casrkuuedp6an1.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d5fe3s4ckn7lk9',
    location: 'US East',
    tier: 'Production (Slow)'
  }
};

// Realistic test scenarios
const testScenarios = [
  {
    name: 'User Authentication',
    queries: [
      'SELECT 1 as user_exists',
      'SELECT NOW() as login_time',
      'SELECT md5(random()::text) as session_token'
    ],
    description: 'Simulate user login process'
  },
  {
    name: 'Dashboard Load',
    queries: [
      'SELECT generate_series(1, 10) as id, md5(random()::text) as data',
      'SELECT COUNT(*) as total_count FROM generate_series(1, 100)',
      'SELECT AVG(generate_random_uuid()::text::numeric) as avg_metric'
    ],
    description: 'Simulate dashboard data loading'
  },
  {
    name: 'Heavy Query',
    queries: [
      'SELECT generate_series(1, 1000) as id, random() as value, md5(random()::text) as hash',
      'SELECT COUNT(*) FROM generate_series(1, 10000) WHERE random() > 0.5'
    ],
    description: 'Simulate heavy data processing'
  }
];

async function runLoadTest(dbName, config, iterations = 3) {
  console.log(`\n🎯 Load Testing ${dbName} (${iterations} iterations)...`);
  
  const results = {
    dbName,
    location: config.location,
    tier: config.tier,
    iterations,
    scenarios: [],
    avgTotalTime: 0,
    minTime: Infinity,
    maxTime: 0,
    reliability: 0,
    error: null
  };

  try {
    const pool = new Pool({
      connectionString: config.url,
      ssl: !config.url.includes('localhost') ? { rejectUnauthorized: false } : false,
      max: 5,
      connectionTimeoutMillis: 15000
    });

    let totalSuccessful = 0;
    let totalTime = 0;
    const allTimes = [];

    for (let i = 0; i < iterations; i++) {
      console.log(`  🔄 Iteration ${i + 1}/${iterations}`);
      
      const iterationStart = performance.now();
      let iterationSuccessful = true;

      for (const scenario of testScenarios) {
        const scenarioStart = performance.now();
        
        try {
          const client = await pool.connect();
          
          for (const query of scenario.queries) {
            await client.query(query);
          }
          
          client.release();
          
          const scenarioTime = performance.now() - scenarioStart;
          
          if (!results.scenarios.find(s => s.name === scenario.name)) {
            results.scenarios.push({
              name: scenario.name,
              times: [],
              avgTime: 0,
              success: 0,
              total: iterations
            });
          }
          
          const scenarioResult = results.scenarios.find(s => s.name === scenario.name);
          scenarioResult.times.push(scenarioTime);
          scenarioResult.success++;
          
        } catch (error) {
          console.log(`    ❌ ${scenario.name} failed: ${error.message}`);
          iterationSuccessful = false;
        }
      }
      
      if (iterationSuccessful) {
        const iterationTime = performance.now() - iterationStart;
        allTimes.push(iterationTime);
        totalTime += iterationTime;
        totalSuccessful++;
        
        results.minTime = Math.min(results.minTime, iterationTime);
        results.maxTime = Math.max(results.maxTime, iterationTime);
        
        console.log(`    ✅ Completed in ${Math.round(iterationTime)}ms`);
      }
      
      // Wait between iterations
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await pool.end();

    // Calculate final metrics
    results.reliability = (totalSuccessful / iterations) * 100;
    results.avgTotalTime = totalSuccessful > 0 ? Math.round(totalTime / totalSuccessful) : 0;
    results.minTime = results.minTime === Infinity ? 0 : Math.round(results.minTime);
    results.maxTime = Math.round(results.maxTime);

    // Calculate scenario averages
    results.scenarios.forEach(scenario => {
      if (scenario.times.length > 0) {
        scenario.avgTime = Math.round(scenario.times.reduce((a, b) => a + b, 0) / scenario.times.length);
      }
    });

    console.log(`  📊 Success Rate: ${results.reliability}%`);
    console.log(`  ⚡ Avg Time: ${results.avgTotalTime}ms`);
    console.log(`  📈 Range: ${results.minTime}ms - ${results.maxTime}ms`);

  } catch (error) {
    console.log(`  ❌ Load test failed: ${error.message}`);
    results.error = error.message;
  }

  return results;
}

async function runComprehensiveBenchmark() {
  console.log('🚀 COMPREHENSIVE DATABASE BENCHMARK');
  console.log('Testing with realistic application load patterns');
  console.log('=' .repeat(80));
  
  const results = [];
  
  for (const [dbName, config] of Object.entries(databases)) {
    const result = await runLoadTest(dbName, config, 3);
    results.push(result);
    
    // Wait between database tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate comprehensive report
  console.log('\n📈 COMPREHENSIVE BENCHMARK REPORT');
  console.log('=' .repeat(80));
  
  const successful = results.filter(r => r.reliability > 0);
  const failed = results.filter(r => r.reliability === 0);
  
  // Sort by performance score (combination of speed and reliability)
  successful.forEach(result => {
    result.performanceScore = result.reliability - (result.avgTotalTime / 10);
  });
  
  successful.sort((a, b) => b.performanceScore - a.performanceScore);
  
  console.log('\n🏆 OVERALL PERFORMANCE RANKING:');
  console.log('-'.repeat(80));
  
  successful.forEach((result, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '📊';
    
    console.log(`${medal} ${rank}. ${result.dbName} (${result.tier})`);
    console.log(`   📍 Location: ${result.location}`);
    console.log(`   ⚡ Average Time: ${result.avgTotalTime}ms`);
    console.log(`   📈 Time Range: ${result.minTime}ms - ${result.maxTime}ms`);
    console.log(`   🎯 Reliability: ${result.reliability}%`);
    console.log(`   🏅 Performance Score: ${Math.round(result.performanceScore)}`);
    
    // Show scenario breakdown
    console.log(`   📊 Scenario Performance:`);
    result.scenarios.forEach(scenario => {
      const successRate = Math.round((scenario.success / scenario.total) * 100);
      console.log(`      ${scenario.name}: ${scenario.avgTime}ms (${successRate}% success)`);
    });
    
    console.log('');
  });
  
  if (failed.length > 0) {
    console.log('\n❌ FAILED DATABASES:');
    console.log('-'.repeat(80));
    
    failed.forEach(result => {
      console.log(`❌ ${result.dbName} (${result.tier})`);
      console.log(`   📍 Location: ${result.location}`);
      console.log(`   💥 Error: ${result.error || 'Failed all test scenarios'}`);
      console.log('');
    });
  }
  
  // Environment recommendations
  console.log('\n💡 ENVIRONMENT-SPECIFIC RECOMMENDATIONS:');
  console.log('-'.repeat(80));
  
  console.log('🏠 DEVELOPMENT ENVIRONMENT:');
  const devRecommendation = successful.find(r => r.tier.includes('Development')) || successful[0];
  if (devRecommendation) {
    console.log(`   ✅ Use: ${devRecommendation.dbName}`);
    console.log(`   📈 Performance: ${devRecommendation.avgTotalTime}ms average`);
    console.log(`   🎯 Reliability: ${devRecommendation.reliability}%`);
  }
  
  console.log('\n🌐 PRODUCTION ENVIRONMENT:');
  const prodRecommendations = successful.filter(r => r.tier.includes('Production'));
  if (prodRecommendations.length > 0) {
    const bestProd = prodRecommendations[0];
    console.log(`   ✅ Primary Choice: ${bestProd.dbName}`);
    console.log(`   📈 Performance: ${bestProd.avgTotalTime}ms average`);
    console.log(`   🎯 Reliability: ${bestProd.reliability}%`);
    console.log(`   📍 Location: ${bestProd.location}`);
    
    if (prodRecommendations.length > 1) {
      const backupProd = prodRecommendations[1];
      console.log(`   🔄 Backup Choice: ${backupProd.dbName}`);
      console.log(`   📈 Performance: ${backupProd.avgTotalTime}ms average`);
      console.log(`   🎯 Reliability: ${backupProd.reliability}%`);
    }
  }
  
  // Performance insights
  if (successful.length > 1) {
    console.log('\n📊 PERFORMANCE INSIGHTS:');
    console.log('-'.repeat(80));
    
    const fastest = successful[0];
    const slowest = successful[successful.length - 1];
    
    const speedDifference = Math.round(((slowest.avgTotalTime - fastest.avgTotalTime) / fastest.avgTotalTime) * 100);
    console.log(`🚀 Speed Difference: ${fastest.dbName} is ${speedDifference}% faster than ${slowest.dbName}`);
    
    const avgTime = Math.round(successful.reduce((sum, r) => sum + r.avgTotalTime, 0) / successful.length);
    console.log(`📈 Average Response Time: ${avgTime}ms`);
    
    const avgReliability = Math.round(successful.reduce((sum, r) => sum + r.reliability, 0) / successful.length);
    console.log(`🎯 Average Reliability: ${avgReliability}%`);
  }
  
  console.log('\n🏁 Benchmark completed successfully!');
  console.log('💡 Tip: For production, consider the database closest to your target users.');
}

// Run the comprehensive benchmark
runComprehensiveBenchmark().catch(console.error);
