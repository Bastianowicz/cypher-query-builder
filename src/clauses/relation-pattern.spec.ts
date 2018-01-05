import { RelationPattern } from './relation-pattern';
import { keys, values } from 'lodash';
import { expect } from '../../test-setup';

describe('Relation', function() {
  describe('#build', function() {
    it('should build a relation pattern directed inwards', function() {
      let rel = new RelationPattern('in');
      let queryObj = rel.buildQueryObject();

      expect(queryObj.query).to.equal('<-[]-');
      expect(queryObj.params).to.be.empty;
    });

    it('should build a relation pattern directed outwards', function() {
      let rel = new RelationPattern('out');
      let queryObj = rel.buildQueryObject();

      expect(queryObj.query).to.equal('-[]->');
      expect(queryObj.params).to.be.empty;
    });

    it('should build a relation pattern that is directionless', function() {
      let rel = new RelationPattern('either');
      let queryObj = rel.buildQueryObject();

      expect(queryObj.query).to.equal('-[]-');
      expect(queryObj.params).to.be.empty;
    });

    it('should build a relation pattern with a label', function() {
      let rel = new RelationPattern('in', 'FriendsWith');
      let queryObj = rel.buildQueryObject();

      expect(queryObj.query).to.equal('<-[:FriendsWith]-');
      expect(queryObj.params).to.be.empty;
    });

    it('should build a relation pattern with a variable name', function() {
      let rel = new RelationPattern('in', 'link', 'Link');
      let queryObj = rel.buildQueryObject();

      expect(queryObj.query).to.equal('<-[link:Link]-');
      expect(queryObj.params).to.be.empty;
    });

    it('should build a relation pattern with multiple labels', function() {
      let rel = new RelationPattern('in', ['FriendsWith', 'WorksWith']);
      let queryObj = rel.buildQueryObject();

      expect(queryObj.query).to.equal('<-[:FriendsWith:WorksWith]-');
      expect(queryObj.params).to.be.empty;
    });

    it('should build a relation pattern with conditions', function() {
      let rel = new RelationPattern('out', {recent: true, years: 7});
      let queryObj = rel.buildQueryObject();

      expect(queryObj.query).to.match(/^-\[\{ recent: \$[a-zA-Z0-9-_]+, years: \$[a-zA-Z0-9-_]+ \}\]->$/);
      expect(keys(queryObj.params)).to.have.length(2);
      expect(values(queryObj.params)).to.have.members([true, 7]);
    });

    it('should build a relation pattern with flexible length', function() {
      let any = new RelationPattern('out', '', [], {}, '*');
      let exact = new RelationPattern('out', '', [], {}, 3);
      let minBound = new RelationPattern('out', '', [], {}, [2]);
      let bothBounds = new RelationPattern('out', '', [], {}, [2, 7]);

      expect(any.buildQueryObject().query).to.equal('-[*]->');
      expect(exact.buildQueryObject().query).to.equal('-[*3]->');
      expect(minBound.buildQueryObject().query).to.equal('-[*2..]->');
      expect(bothBounds.buildQueryObject().query).to.equal('-[*2..7]->');
    });

    it('should build a complete relation pattern', function() {
      let rel = new RelationPattern('either', 'f', ['FriendsWith', 'WorksWith'], {recent: true, years: 7}, [2, 3]);
      let queryObj = rel.buildQueryObject();

      expect(queryObj.query).to.match(/^-\[f:FriendsWith:WorksWith\*2\.\.3 \{ recent: \$[a-zA-Z0-9-_]+, years: \$[a-zA-Z0-9-_]+ \}\]-$/);
      expect(keys(queryObj.params)).to.have.length(2);
      expect(values(queryObj.params)).to.have.members([true, 7]);});
  });
});