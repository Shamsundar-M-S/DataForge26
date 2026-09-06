export interface QuizOption {
  readonly id: string;
  readonly text: string;
}

export interface QuizQuestion {
  readonly id: string;
  readonly prompt: string;
  readonly options: readonly QuizOption[];
  readonly correctOptionId: string;
  readonly explanation: string;
}

/**
 * Checks understanding of what the learner just did. Every answer can be
 * verified by going back to the workstation and trying it, which is the point.
 */
export const LEARNING_CHECK: readonly QuizQuestion[] = [
  {
    id: 'q1',
    prompt:
      'You reduce Vehicle 1\'s capacity by 5 kg and the plan does not change at all. What does that tell you?',
    options: [
      { id: 'a', text: 'The solver ignored the change.' },
      {
        id: 'b',
        text: 'The capacity limit still is not binding — the vehicle had at least 5 kg to spare.',
      },
      { id: 'c', text: 'Capacity has no effect on routing.' },
      { id: 'd', text: 'The problem became infeasible and fell back to the old plan.' },
    ],
    correctOptionId: 'b',
    explanation:
      'A constraint only changes the answer once it starts to bind. While the load sits below the limit, ' +
      'the limit is doing no work, and tightening it costs nothing. The interesting behaviour is at the ' +
      'threshold where the slack runs out.',
  },
  {
    id: 'q2',
    prompt:
      'After tightening Vehicle 1, Vehicle 2 ends up visiting its customers in a different order — even ' +
      'though you never touched Vehicle 2. Why?',
    options: [
      { id: 'a', text: 'Its capacity was secretly changed too.' },
      { id: 'b', text: 'The visualisation redraws tours randomly.' },
      {
        id: 'c',
        text: 'It received a customer the other vehicle could no longer carry, and the shortest tour through its new set of customers is a different order.',
      },
      { id: 'd', text: 'Vehicle 2 always mirrors Vehicle 1.' },
    ],
    correctOptionId: 'c',
    explanation:
      'This is the whole lesson. The objective is total distance across the fleet, so the vehicles are not ' +
      'solving separate problems. A constraint that binds on one of them changes what the other has to do.',
  },
  {
    id: 'q3',
    prompt:
      'The failure screen says total demand is 125 kg and total capacity is 60 kg. What has been established?',
    options: [
      {
        id: 'a',
        text: 'That no assignment can exist, because the totals alone rule it out.',
      },
      { id: 'b', text: 'That the solver searched hard and did not find one.' },
      { id: 'c', text: 'That a better algorithm might find a plan.' },
      { id: 'd', text: 'That the instance needs more customers.' },
    ],
    correctOptionId: 'a',
    explanation:
      'This is proof, not failure to find. Every kilogram has to travel on some vehicle, so the sum of the ' +
      'capacities is an upper bound on the demand that can be served. When demand exceeds it, no algorithm ' +
      'can help. "No solution was found" and "no solution exists" are different statements, and here it is the second.',
  },
  {
    id: 'q4',
    prompt:
      'You raise one customer\'s demand and the total distance goes up, even though no customer moved to a ' +
      'different vehicle. What happened?',
    options: [
      { id: 'a', text: 'Distance depends on demand.' },
      { id: 'b', text: 'The solver made an error.' },
      {
        id: 'c',
        text: 'Nothing consistent — if no assignment or ordering changed, the distance cannot change.',
      },
      { id: 'd', text: 'Heavier loads travel more slowly.' },
    ],
    correctOptionId: 'c',
    explanation:
      'Distance here is purely geometric: it depends on which customers a vehicle visits and in what order, ' +
      'never on how heavy they are. If the distance moved, something about the assignment or the ordering ' +
      'moved with it — check the before/after panel and you will find it.',
  },
  {
    id: 'q5',
    prompt: 'Which statement about this app and BDH is accurate?',
    options: [
      { id: 'a', text: 'The routing solver is a small BDH model.' },
      { id: 'b', text: 'The solver reproduces BDH\'s Sudoku result on a routing problem.' },
      {
        id: 'c',
        text: 'The solver shares no mechanism with BDH; the two are linked only by the kind of problem, and BDH\'s constraint result is reported by its developer.',
      },
      { id: 'd', text: 'BDH is a constraint solver that this app reimplements.' },
    ],
    correctOptionId: 'c',
    explanation:
      'The solver is exhaustive enumeration; BDH is a trained sequence-model architecture. The honest link ' +
      'is the class of problem — many rules that must hold at once — not the method. And BDH\'s Sudoku ' +
      'Extreme figure comes from Pathway\'s internal implementation, which its own repository notes is not ' +
      'reproduced by the public code.',
  },
];
