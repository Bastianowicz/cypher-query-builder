import { Clause } from './clause';
import { Dictionary, join, Many, map } from 'lodash';
import { Connection } from './connection';
import { Create, Match, NodePattern, Set, Unwind, Return, With, Delete, Where } from './clauses/index';
import { PatternCollection } from './clauses/pattern-clause';
import { MatchOptions } from './clauses/match';
import { SetOptions, SetProperties } from './clauses/set';
import { Term } from './clauses/term-list-clause';
import { DeleteOptions } from './clauses/delete';
import { SanitizedRecord, SanitizedValue } from './transformer';
import { Builder } from './builder';
import { Skip } from './clauses/skip';
import { Limit } from './clauses/limit';
import { AnyConditions } from './clauses/where-utils';
import { Direction, OrderBy, OrderConstraints } from './clauses/order-by';
import { Raw } from './clauses/raw';

export class Query extends Clause implements Builder {
  protected clauses: Clause[] = [];

  constructor(protected connection: Connection = null) {
    super();
  }

  matchNode(name?: Many<string> | Dictionary<any>, labels?: Many<string> | Dictionary<any>, conditions?: Dictionary<any>) {
    return this.addClause(new Match(new NodePattern(name, labels, conditions)));
  }

  match(patterns: PatternCollection, options?: MatchOptions) {
    return this.addClause(new Match(patterns, options));
  }

  optionalMatch(patterns: PatternCollection, options: MatchOptions = {}) {
    return this.addClause(new Match(patterns, Object.assign(options, {
      optional: true,
    })));
  }

  createNode(name?: Many<string> | Dictionary<any>, labels?: Many<string> | Dictionary<any>, conditions?: Dictionary<any>) {
    return this.addClause(new Create(new NodePattern(name, labels, conditions)));
  }

  create(patterns: PatternCollection) {
    return this.addClause(new Create(patterns));
  }

  return(terms: Many<Term>) {
    return this.addClause(new Return(terms));
  }

  with(terms: Many<Term>) {
    return this.addClause(new With(terms));
  }

  unwind(list: any[], name: string) {
    return this.addClause(new Unwind(list, name));
  }

  delete(terms: Many<string>, options?: DeleteOptions) {
    return this.addClause(new Delete(terms, options));
  }

  detachDelete(terms: Many<string>, options: DeleteOptions = {}) {
    return this.addClause(new Delete(terms, Object.assign(options, {
      detach: true,
    })));
  }

  set(properties: SetProperties, options: SetOptions) {
    return this.addClause(new Set(properties, options));
  }

  setLabels(labels: Dictionary<Many<string>>) {
    return this.addClause(new Set({ labels }));
  }

  setValues(values: Dictionary<any>) {
    return this.addClause(new Set({ values }));
  }

  setVariables(variables: Dictionary<string | Dictionary<string>>, override?: boolean) {
    return this.addClause(new Set(
      { variables },
      { override }
    ));
  }

  skip(amount: string | number) {
    return this.addClause(new Skip(amount));
  }

  limit(amount: string | number) {
    return this.addClause(new Limit(amount));
  }

  where(conditions: AnyConditions) {
    return this.addClause(new Where(conditions));
  }

  orderBy(fields: Many<string> | OrderConstraints, dir?: Direction) {
    return this.addClause(new OrderBy(fields, dir));
  }

  raw(clause: string, params: Dictionary<any> = {}) {
    return this.addClause(new Raw(clause, params));
  }

  build() {
    return join(map(this.clauses, s => s.build()), '\n') + ';';
  }

  getClauses() {
    return this.clauses;
  }

  /**
   * Adds a clause to the child list.
   * @param {Clause} clause
   * @return {Query}
   */
  addClause(clause) {
    clause.useParameterBag(this.parameterBag);
    this.clauses.push(clause);
    return this;
  }

  async run<R = SanitizedValue>(): Promise<SanitizedRecord<R>[]> {
    if (!this.connection) {
      throw Error('Cannot run query; no connection object available.');
    }

    return this.connection.run<R>(this);
  }
}
