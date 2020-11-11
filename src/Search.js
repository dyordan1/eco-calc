import React from 'react';
import {fade, withStyles} from '@material-ui/core/styles';
import Autosuggest from 'react-autosuggest'
import match from 'autosuggest-highlight/match'
import parse from 'autosuggest-highlight/parse'
import {Chip, Divider, MenuItem, Paper} from '@material-ui/core';
import {Search} from '@material-ui/icons';
import {DBContext} from './LocalDB.js';
import ChipInput from 'material-ui-chip-input'

const styles = (theme) => ({
  search: {
    flexGrow: 1,
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(3),
      width: 'auto',
    },
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    color: 'inherit',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create('width'),
    width: '100%',
  },
  suggestionsContainer: {
    position: 'absolute',
    width: '100%',
  },
  chip: {
    margin: '0 2px',
  }
});

class SearchBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      suggestions: [],
      searchString: '',
    };
  }

  handleSuggestionsFetchRequested = ({ value }) => {
    value = value.toLowerCase();
    if (value.length < 2) {
      if (this.state.suggestions.length) {
        this.setState({
          suggestions: []
        })
      }
      return;
    }

    let suggestions = this.context.getSuggestionsFor(value);
    this.setState({
      suggestions: suggestions,
    })
  };

  handleSuggestionsClearRequested = () => {
    this.setState({
      suggestions: []
    })
  };

  handletextFieldInputChange = (event, { newValue }) => {
    this.setState({
      searchString: newValue
    })
  };

  handleAddChip (chip) {
    if (!this.context.hasProductFilter(chip)) {
      this.context.addProductFilter(chip);
    }
    this.setState({
      searchString: ''
    })
  }

  handleDeleteChip (chip, index) {
    if (this.context.hasProductFilter(chip)) {
      this.context.removeProductFilter(chip);
    }
    this.setState({
      searchString: ''
    })
  };

  addTable(table) {
    this.context.addProductFilter(table);
  }

  renderInput (inputProps) {
    const { value, onChange, chips, ref, ...other } = inputProps

    return (
      <ChipInput
        clearInputValueOnChange
        onUpdateInput={onChange}
        chipRenderer={({ value, text, chip, isFocused, isDisabled, isReadOnly, handleClick, handleDelete, className }, key) => {
          return <Chip className={this.props.classes.chip} label={value.type == 'skill' ? value.label + ' L' + value.level : value.label} onDelete={handleDelete}/>;
        }}
        value={chips}
        inputRef={ref}
        {...other}
      />
    )
  }

  renderSuggestionsContainer = (options) => {
    const { containerProps, children } = options

    return (
      <Paper {...containerProps} className={this.props.classes.suggestionsContainer} square>
        {children}
      </Paper>
    )
  }

  getSuggestionValue = (suggestion) => {
    return suggestion;
  }

  getSectionSuggestions = (section) => {
    return section.suggestions;
  }

  renderSectionTitle = (section) => {
    return <>
      <Divider/>
      <strong>{section.title}</strong>
      <Divider/>
    </>;
  }

  renderSuggestion (suggestion, { query, isHighlighted }) {
    const matches = match(suggestion.label, query)
    const parts = parse(suggestion.label, matches)

    return (
      <MenuItem
        selected={isHighlighted}
        component='div'
        onMouseDown={(e) => e.preventDefault()} // prevent the click causing the input to be blurred
      >
        <div>
          {parts.map((part, index) => {
            return part.highlight ? (
              <span key={String(index)} style={{ fontWeight: 1000 }}>
                {part.text}
              </span>
            ) : (
              <span key={String(index)}>
                {part.text}
              </span>
            )
          })}
          {suggestion.level !== undefined && ' L' + suggestion.level}
        </div>
      </MenuItem>
    )
  }

  render() {
    const {classes} = this.props;

    return <div className={classes.search}>
            <div className={classes.searchIcon}>
              <Search />
            </div>
            <Autosuggest
              multiSection={true}
              renderInputComponent={(props) => this.renderInput(props)}
              suggestions={this.state.suggestions}
              getSectionSuggestions={this.getSectionSuggestions}
              renderSectionTitle={this.renderSectionTitle}
              onSuggestionsFetchRequested={this.handleSuggestionsFetchRequested}
              onSuggestionsClearRequested={this.handleSuggestionsClearRequested}
              renderSuggestionsContainer={this.renderSuggestionsContainer}
              getSuggestionValue={this.getSuggestionValue}
              renderSuggestion={this.renderSuggestion}
              onSuggestionSelected={(e, { suggestionValue }) => { this.handleAddChip(suggestionValue); e.preventDefault() }}
              inputProps={{
                chips: [...this.context.getProductFilters()],
                value: this.state.searchString,
                onChange: this.handletextFieldInputChange,
                onAdd: (chip) => this.handleAddChip(chip),
                onDelete: (chip, index) => this.handleDeleteChip(chip, index),
                className: classes.inputInput
              }}
            />
          </div>;
  }
}

SearchBar.contextType = DBContext;
export default withStyles(styles, {withTheme: true})(SearchBar);
