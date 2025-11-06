import { GameParameters } from "@/types";

export const getDefaultParameters = (): GameParameters => ({
  ParametersTimeFirst: 30,
  ParametersTimeSecond: 20,
  ParametersTimeThird: 15,
  ParametersTeamReroll: 3,
  ParametersTeamMaxForbiddenWords: 2,
  ParametersTeamMaxPropositions: 5,
  ParametersPointsMaxScore: 10,
  ParametersPointsRules: "no-tie",
  ParametersWordsListSelection: {
    veryCommon: true,
    lessCommon: true,
    rarelyCommon: false,
  },
});
