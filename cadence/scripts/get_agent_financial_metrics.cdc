// FILE: cadence/scripts/get_agent_financial_metrics.cdc

import MockFarm from "../contracts/MockFarm.cdc"
import MockFarm2 from "../contracts/MockFarm2.cdc"
import MockFarm3 from "../contracts/MockFarm3.cdc"

// This script gets financial metrics for an agent including APY and profit/loss
access(all) fun main(address: Address): {String: UFix64} {
    let account = getAccount(address)
    
    // Get references to all farms
    let farm1Ref = account.contracts.borrow<&MockFarm>(name: "MockFarm")
        ?? panic("Could not borrow MockFarm contract")
    let farm2Ref = account.contracts.borrow<&MockFarm2>(name: "MockFarm2")
        ?? panic("Could not borrow MockFarm2 contract")
    let farm3Ref = account.contracts.borrow<&MockFarm3>(name: "MockFarm3")
        ?? panic("Could not borrow MockFarm3 contract")
    
    // Get staked amounts from each farm
    let stakedFarm1: UFix64 = farm1Ref.stakedBalances[address] ?? 0.0
    let stakedFarm2: UFix64 = farm2Ref.stakedBalances[address] ?? 0.0
    let stakedFarm3: UFix64 = farm3Ref.stakedBalances[address] ?? 0.0
    
    // Calculate total staked amount
    let totalStaked: UFix64 = stakedFarm1 + stakedFarm2 + stakedFarm3
    
    // Calculate current APY based on where the agent is staked
    // For demo purposes, we'll use the highest APY if staked in multiple farms
    var currentAPY: UFix64 = 0.0
    if stakedFarm2 > 0.0 {
        currentAPY = 0.15  // Farm 2 has 15% APY
    } else if stakedFarm1 > 0.0 {
        currentAPY = 0.10  // Farm 1 has 10% APY
    } else if stakedFarm3 > 0.0 {
        currentAPY = 0.05  // Farm 3 has 5% APY
    }
    
    // Calculate potential annual rewards based on current APY
    let annualRewards: UFix64 = totalStaked * currentAPY
    
    // Calculate monthly rewards (annual / 12)
    let monthlyRewards: UFix64 = annualRewards / 12.0
    
    // Calculate daily rewards (annual / 365)
    let dailyRewards: UFix64 = annualRewards / 365.0
    
    // For demo purposes, calculate total profit based on staked amount and time
    // In a real implementation, this would track actual rewards claimed
    let estimatedTotalProfit: UFix64 = totalStaked * 0.25  // Assume 25% total profit for demo
    
    // Calculate profit percentage
    var profitPercentage: UFix64 = 0.0
    if totalStaked > 0.0 {
        profitPercentage = (estimatedTotalProfit / totalStaked) * 100.0
    }
    
    return {
        "totalStaked": totalStaked,
        "currentAPY": currentAPY,
        "annualRewards": annualRewards,
        "monthlyRewards": monthlyRewards,
        "dailyRewards": dailyRewards,
        "totalProfit": estimatedTotalProfit,
        "profitPercentage": profitPercentage,
        "stakedFarm1": stakedFarm1,
        "stakedFarm2": stakedFarm2,
        "stakedFarm3": stakedFarm3
    }
}
