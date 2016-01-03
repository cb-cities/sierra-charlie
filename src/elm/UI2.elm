module UI2 where

import Html exposing (Html, button, div, li, span, text, ul)
import Html.Attributes exposing (style)
import StartApp.Simple as StartApp

import Common.Html.Events exposing (onClick)
import Common.Zipper exposing (..) -- TODO
import Custom exposing (..) -- TODO


type alias UI =
    Zipper LeafInfo BranchInfo

type alias Model =
  { geometries : List Geometry
  , ui : UI
  }


type LeafInfo =
    Text String
  | Time String
  | Circle String
  | Choice (List String)


type BranchInfo =
    Regular


model : Model
model =
  { geometries = []
  , ui = ui
  }


ui : UI
ui =
    Zipper
      ( Branch "Root" Regular
          [ Branch "Geometries" Regular
              [ Branch "London 2014-05-21" Regular []
              , Branch "New geometry…" Regular []
              ]
          , Branch "Imports" Regular
              [ Branch "Google 2015-10-01" Regular
                  [ Branch "Settings" Regular
                      [ Leaf "Service" (Choice ["Google"])
                      , Leaf "API Key" (Text "0123456789abcdef")
                      , Branch "Phases" Regular
                          [ Branch "Phase 1" Regular
                              [ Leaf "Start time" (Time "6:00")
                              , Leaf "End time" (Time "8:00")
                              , Branch "Start areas" Regular
                                  [ Leaf "Area 1" (Circle "10@100,200")
                                  , Leaf "Area 2" (Circle "20@150,250")
                                  ]
                              , Branch "End areas" Regular
                                  [ Leaf "Area 1" (Circle "5@300,400")
                                  ]
                              ]
                          , Branch "Phase 2" Regular
                              [ Leaf "Start time" (Time "16:00")
                              , Leaf "End time" (Time "18:00")
                              , Branch "Start areas" Regular
                                  [ Leaf "Area 1" (Circle "5@300,400")
                                  ]
                              , Branch "End areas" Regular
                                  [ Leaf "Area 1" (Circle "10@100,200")
                                  , Leaf "Area 2" (Circle "20@150,250")
                                  ]
                              ]
                          ]
                      ]
                  , Branch "Routes" Regular []
                  ]
              , Branch "New import…" Regular []
              ]
          , Branch "Simulations" Regular
              [ Branch "Simulation 1" Regular []
              , Branch "New simulation…" Regular []
              ]
          ]
      )
      []


type Action =
  Go Steps


update : Action -> Model -> Model
update action model =
  case action of
    Go steps ->
      let
        updateUI = followSteps steps
      in
        case updateUI model.ui of
          Nothing -> model -- TODO: Log error
          Just newUI -> {model | ui = newUI}


type alias Address =
    Signal.Address Action


viewShallowTree : Address -> Steps -> Tree a b -> Html
viewShallowTree address steps tree =
    case tree of
      Leaf key value ->
        li [regularStyle, onClick address (Go steps)]
          [ span [] [text (key ++ ": ")]
          , span [italicStyle] [text (toString value)]
          ]
      Branch key value subtrees ->
        li [regularStyle, onClick address (Go steps)]
          [ text key
          ]


viewSubtree : Address -> Steps -> Tree a b -> Html
viewSubtree address steps subtree =
    viewTree address (steps ++ [GoInto (keyOf subtree)]) subtree


viewTree : Address -> Steps -> Tree a b -> Html
viewTree address steps tree =
    let
      someStyle =
        case steps of
          [] -> selectedStyle
          _ -> regularStyle
    in
      case tree of
        Leaf key value ->
          li [someStyle, onClick address (Go steps)]
            [ span [] [text (key ++ ": ")]
            , span [italicStyle] [text (toString value)]
            ]
        Branch key value subtrees ->
          li [someStyle, onClick address (Go steps)]
            [ text key
            , ul [] (List.map (viewSubtree address steps) subtrees)
            ]


viewCrumbs : Address -> Crumbs a b -> Steps -> Html -> Html
viewCrumbs address crumbs steps viewedSubtree =
    case crumbs of
      [] ->
        ul [noStyle] [viewedSubtree]
      (Crumb key value subtrees1 subtrees2 :: moreCrumbs) ->
        let
          viewedBranch =
            li [regularStyle, onClick address (Go steps)]
              [ text key
              , ul []
                  (  List.map (viewSubtree address steps) subtrees1
                  ++ [viewedSubtree]
                  ++ List.map (viewSubtree address steps) subtrees2
                  )
              ]
        in
          viewCrumbs address moreCrumbs (steps ++ [GoOut]) viewedBranch


viewZipper : Address -> Zipper a b -> Html
viewZipper address (Zipper tree crumbs) =
    viewCrumbs address crumbs [GoOut] (viewTree address [] tree)


view : Address -> Model -> Html
view address model =
  viewZipper address model.ui


main : Signal Html
main =
    StartApp.start
      { model = model
      , update = update
      , view = view
      }


selectedStyle : Html.Attribute
selectedStyle =
    style
      [ ("border", "2px solid rgb(0, 127, 255)")
      -- , ("background", "rgba(0, 127, 255, 0.2)")
      , ("padding", "4px")
      , ("margin", "4px")
      , ("list-style", "none")
      , ("cursor", "pointer")
      ]


regularStyle : Html.Attribute
regularStyle =
    style
      [ ("border", "2px solid rgb(191, 191, 191)")
      -- , ("background", "rgba(255, 255, 255, 1)")
      , ("padding", "4px")
      , ("margin", "4px")
      , ("list-style", "none")
      , ("cursor", "pointer")
      ]


italicStyle : Html.Attribute
italicStyle =
    style
      [ ("font-style", "italic")
      ]


noStyle : Html.Attribute
noStyle =
    style
      [ ("padding", "0")
      , ("margin", "0")
      ]
