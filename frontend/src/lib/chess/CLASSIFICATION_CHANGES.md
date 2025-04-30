# Chess Move Classification Changes

## Overview

The move classification system has been updated to be more direct and similar to the freechess-github implementation. The main changes focus on making the classification more decisive and less "soft" by using direct centipawn evaluation loss rather than win percentage differences.

## Key Changes

### 1. Direct Centipawn Loss Calculation

**Before:**
- Used win percentage differences to classify moves
- This approach was more forgiving and resulted in more "good" and "best" classifications

**After:**
- Uses direct centipawn loss calculation
- More decisive classification based on concrete evaluation differences
- Follows the freechess approach of calculating evaluation loss directly

```javascript
// Direct centipawn loss calculation (like freechess)
if (isWhiteMove) {
    evalLoss = previousEvaluation.value - (evaluation?.value || 0);
} else {
    evalLoss = (evaluation?.value || 0) - previousEvaluation.value;
}
```

### 2. Simplified Brilliant Move Detection

**Before:**
- Complex logic with multiple conditions
- Considered counter-intuitive defensive resources and win percentage differences

**After:**
- More focused on piece sacrifices that maintain or improve position
- Simpler detection logic similar to freechess
- Requires the move to not lose material and involve a piece sacrifice

```javascript
// Simplified brilliant move detection (more like freechess)
if (absoluteEvaluation >= 0 && evalLoss <= 0) {
    // Check for piece sacrifice
    if (isPieceSacrifice(lastPosition.fen, playedMove, bestLinePvToPlay)) {
        position.classification = Classification.BRILLIANT;
    }
}
```

### 3. Simplified Great Move Detection

**Before:**
- Multiple complex conditions for great move detection
- Considered game outcome changes, defensive resources, etc.

**After:**
- Focuses on recovering from blunders
- Requires a significant difference between top and second-best move
- More similar to freechess implementation

```javascript
// Simplified great move detection (more like freechess)
if (prevPosition?.classification === Classification.BLUNDER) {
    // If there's a significant difference between top and second best move
    if (Math.abs((topMove.evaluation.value || 0) - (secondTopMove?.evaluation.value || 0)) >= 150) {
        position.classification = Classification.GREAT;
    }
}
```

### 4. Direct Classification Thresholds

**Before:**
- Win percentage difference thresholds:
  - BLUNDER: < -20%
  - MISTAKE: < -10%
  - INACCURACY: < -5%
  - GOOD: < -2%
  - EXCELLENT: >= -2%

**After:**
- Direct centipawn loss thresholds:
  - BLUNDER: > 200 centipawns
  - MISTAKE: > 100 centipawns
  - INACCURACY: > 50 centipawns
  - GOOD: > 20 centipawns
  - EXCELLENT: >= 0 centipawns
  - BEST: < 0 centipawns (improvement)

### 5. Stricter Handling of Special Cases

**Before:**
- Downgraded blunders to GOOD in some cases
- Had many special cases for different scenarios

**After:**
- Only downgrades blunders to MISTAKE in specific cases
- More direct approach to classification
- Follows freechess logic for handling completely winning/losing positions

```javascript
// Do not allow blunder if move still completely winning (like freechess)
if (position.classification === Classification.BLUNDER && absoluteEvaluation >= 600) {
    position.classification = Classification.MISTAKE;
}
```

## Testing

A simple test script (`test-direct-classification.js`) has been created to verify the new classification approach. The test confirms that the classification thresholds are working as expected:

- Improvement (negative eval loss): BEST
- No loss (0 eval loss): EXCELLENT
- Small loss (15 centipawns): EXCELLENT
- Medium loss (30 centipawns): GOOD
- Larger loss (60 centipawns): INACCURACY
- Big loss (150 centipawns): MISTAKE
- Huge loss (250 centipawns): BLUNDER

## Expected Results

With these changes, the move classification should now be:

1. More decisive - fewer moves classified as "good" or "best"
2. More direct - based on concrete evaluation differences rather than win percentages
3. More similar to freechess-github's approach
4. Better at identifying truly brilliant and great moves
5. More accurate in classifying mistakes and blunders
