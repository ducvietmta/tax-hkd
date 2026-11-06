/** Allocate time by stage; generation cannot consume review's reservation. */
export class PipelineBudget {
 private readonly deadline:number;
 constructor(now=Date.now()){this.deadline=now+120000;}
 private generationDeadline = 0;
 private reviewDeadline = 0;
 private repairDeadline = 0;
 startGeneration(now = Date.now()) { this.generationDeadline = Math.min(now+80000,this.deadline-40000); }
 generation(now = Date.now()) { return Math.max(1,this.generationDeadline-now); }
 startReview(now = Date.now()) { this.reviewDeadline = Math.min(now+40000,this.deadline); }
 review(now = Date.now()) { return Math.max(1,this.reviewDeadline-now); }
 /** Reserve a real fallback window even when the primary consumes its timeout. */
 primaryReview(hasFallback:boolean,now=Date.now()) {
  const remaining=this.review(now);
  return hasFallback?Math.max(1,remaining-Math.min(15000,Math.floor(remaining*.4))):remaining;
 }
 canRepair(now=Date.now()){return this.deadline-now>=45000;}
 startRepair(now = Date.now()) { this.repairDeadline = Math.min(now+45000,this.deadline-15000); }
 repair(now = Date.now()) { return Math.max(1,this.repairDeadline-now); }
}
