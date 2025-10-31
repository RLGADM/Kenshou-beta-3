import { GameParameters } from "@/types";

export const getDefaultParameters = (): GameParameters => ({
  numberOfPlayers: 4,
  numberOfRounds: 5,
  ParametersTimeFirst: 30,
  ParametersTimeSecond: 20,
  ParametersTimeThird: 15,
  ParametersTeamReroll: 3,
  ParametersTeamMaxForbiddenWords: 2,
  ParametersTeamMaxPropositions: 5,
  ParametersPointsMaxScore: 10,
  ParametersPointsRules: "no-tie",
  ParametersWordsListSelection: "medium",
});
