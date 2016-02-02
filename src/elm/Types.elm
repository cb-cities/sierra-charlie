module Types where


type alias State =
  { mode : Maybe Mode
  , loadingProgress : Float
  , highlightedFeature : Maybe Feature
  , selectedFeature : Maybe Feature
  , routes : List Route
  , adjustment : Maybe Adjustment
  , viewGroups : List ViewGroup
  , activeViews : List View
  , modelGroups : List ModelGroup
  , activeModel : Maybe Model
  }


type alias ViewGroup =
  { name : String
  , views : List View
  }


type alias View =
  { name : String
  , lambda : String
  }


type alias ModelGroup =
  { name : String
  , models : List Model
  }


type alias Model =
  { name : String
  , lambda : String
  , colors : List (Int, Int, Int)
  }


type Mode =
    GetRoute
  | GetRouteFromGoogle


type Action =
    Idle
  | Receive IncomingMessage
  | Send OutgoingMessage
  | SendSpecial SpecialOutgoingMessage


type IncomingMessage =
    UpdateMode (Maybe Mode)
  | UpdateLoadingProgress Float
  | UpdateHighlightedFeature (Maybe Feature)
  | UpdateSelectedFeature (Maybe Feature)
  | UpdateRoutes (List Route)
  | UpdateAdjustment (Maybe Adjustment)
  | UpdateViewGroups (List ViewGroup)
  | UpdateActiveViews (List View)
  | UpdateModelGroups (List ModelGroup)
  | UpdateActiveModel (Maybe Model)


type OutgoingMessage =
    SetMode (Maybe Mode)
  | HighlightFeatureByTOID (Maybe String)
  | SelectFeatureByTOID (Maybe String)
  | DeleteSelectedFeature
  | UndeleteSelectedFeature
  | ClearRoutes
  | ClearAdjustment
  | ChooseViews (List String)
  | ChooseModel (Maybe String)


type SpecialOutgoingMessage =
    SaveRoutesAsJSON
  | SaveAdjustmentAsJSON


type alias RoadNode =
  { toid : String
  , address : Maybe String
  , point : (Float, Float)
  , roadLinkTOIDs : List String
  , isDeleted : Bool
  , isUndeletable : Bool
  }


type alias RoadLink =
  { toid : String
  , term : String
  , nature : String
  , length : Float
  , penalty : Float
  , negativeNodeTOID : Maybe String
  , positiveNodeTOID : Maybe String
  , roads : List Road
  , isDeleted : Bool
  , isUndeletable : Bool
  }


type alias Road =
  { toid : String
  , group : String
  , term : Maybe String
  , name : String
  , roadLinkTOIDs : List String
  , isDeleted : Bool
  }


type alias Route =
  { toid : String
  , startNodeTOID : String
  , endNodeTOID : String
  , roadLinkTOIDs : List String
  }


type alias Feature =
  { tag : String
  , roadNode : Maybe RoadNode
  , roadLink : Maybe RoadLink
  , road : Maybe Road
  , route : Maybe Route
  }


type alias FeatureSet =
  { roadNodeTOIDs : List String
  , roadLinkTOIDs : List String
  , roadTOIDs : List String
  , itemCount : Int
  }


type alias Adjustment =
  { deletedFeatures : FeatureSet
  , itemCount : Int
  }
