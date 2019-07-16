import { Query } from './query';
import { expect } from '../test-setup';
import { Dictionary, each } from 'lodash';
import { node, NodePattern } from './clauses';
import { mockConnection } from '../tests/connection.mock';
import { spy, stub } from 'sinon';
import { ClauseCollection } from './clause-collection';

describe('Query', () => {
  describe('query methods', () => {
    const methods: Dictionary<(q: Query) => Query> = {
      create: q => q.create(new NodePattern('Node')),
      createNode: q => q.createNode('Node'),
      delete: q => q.delete('node'),
      detachDelete: q => q.detachDelete('node'),
      limit: q => q.limit(1),
      match: q => q.match(new NodePattern('Node')),
      matchNode: q => q.matchNode('Node'),
      merge: q => q.merge(node('name')),
      onCreateSet: q => q.onCreate.set({ labels: { a: 'Label' } }),
      onCreateSetLabels: q => q.onCreate.setLabels({ a: 'Label' }),
      onCreateSetValues: q => q.onCreate.setValues({ a: 'name' }),
      onCreateSetVariables: q => q.onCreate.setVariables({ a: 'steve' }),
      onMatchSet: q => q.onMatch.set({ labels: { a: 'Label' } }),
      onMatchSetLabels: q => q.onMatch.setLabels({ a: 'Label' }),
      onMatchSetValues: q => q.onMatch.setValues({ a: 'name' }),
      onMatchSetVariables: q => q.onMatch.setVariables({ a: 'steve' }),
      optionalMatch: q => q.optionalMatch(new NodePattern('Node')),
      orderBy: q => q.orderBy('name'),
      raw: q => q.raw('name'),
      return: q => q.return('node'),
      set: q => q.set({}, { override: false }),
      setLabels: q => q.setLabels({}),
      setValues: q => q.setValues({}),
      setVariables: q => q.setVariables({}, false),
      skip: q => q.skip(1),
      union: q => q.union(),
      unionAll: q => q.unionAll(),
      unwind: q => q.unwind([1, 2, 3], 'number'),
      where: q => q.where([]),
      with: q => q.with('node'),
    };

    each(methods, (fn, name) => {
      it(`${name} should return a chainable query object`, () => {
        const query = new Query();
        expect(fn(query)).to.equal(query);
        expect(query.getClauses().length === 1);
        expect(query.build()).to.equal(`${query.getClauses()[0].build()};`);
      });
    });
  });

  describe('proxied methods', () => {
    class TestQuery extends Query {
      getClauseCollection() {
        return this.clauses;
      }
    }

    const query = new TestQuery();

    const methods: (keyof ClauseCollection)[] = [
      'build',
      'toString',
      'buildQueryObject',
      'interpolate',
      'getClauses',
    ];

    methods.forEach((method) => {
      it(`should proxy the ${method} method to the clause collection`, () => {
        const methodSpy = spy(query.getClauseCollection(), method);
        (query as any)[method]();
        expect(methodSpy.calledOnce).to.be.true;
        methodSpy.restore();
      });
    });
  });

  describe('#run', () => {
    it('should reject the promise if there is no attached connection object', () => {
      const query = new Query();
      return expect(query.run()).to.be.rejectedWith(Error, 'no connection object available');
    });

    it('should run the query on its connection', () => {
      const { connection } = mockConnection();
      const runStub = stub(connection, 'run');
      runStub.returns(Promise.resolve([{}]));
      const query = (new Query(connection)).raw('Query');
      return expect(query.run()).to.be.fulfilled.then(() => {
        expect(runStub.calledOnce);
      });
    });
  });

  describe('#stream', () => {
    it('should throw if there is no attached connection object', () => {
      const query = new Query();
      expect(() => query.stream()).to.throw(Error, 'no connection object available');
    });

    it('should run the query on its connection', () => {
      const { connection } = mockConnection();
      const streamStub = stub(connection, 'stream');
      const query = (new Query(connection)).raw('Query');
      query.stream();
      expect(streamStub.calledOnce);
    });
  });

  describe('#first', () => {
    it('should reject the promise if there is no attached connection object', () => {
      const query = new Query();
      return expect(query.first()).to.be.rejectedWith(Error, 'no connection object available');
    });

    it('should run the query on its connection and return the first result', () => {
      const { connection } = mockConnection();
      const runStub = stub(connection, 'run');
      const firstRecord = { number: 1 };
      runStub.returns(Promise.resolve([firstRecord, { number: 2 }, { number: 3 }]));

      const query = (new Query(connection)).raw('Query');
      return expect(query.first()).to.be.fulfilled.then((result: any) => {
        expect(runStub.calledOnce);
        expect(result).to.equal(firstRecord);
      });
    });

    it('should return undefined if the query returns no results', () => {
      const { connection } = mockConnection();
      const runStub = stub(connection, 'run');
      runStub.returns(Promise.resolve([]));

      const query = (new Query(connection)).raw('Query');
      return expect(query.first()).to.be.fulfilled.then((result: any) => {
        expect(runStub.calledOnce);
        expect(result).to.equal(undefined);
      });
    });
  });
});
