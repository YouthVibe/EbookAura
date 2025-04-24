/**
 * Premium Book Debug Utility
 * 
 * This can be executed in the browser console on a book page to debug premium status
 * by typing: debugPremium()
 */

// Make the function available globally
window.debugPremium = function() {
  console.clear();
  console.log('%c === EbookAura Premium Book Debug ===', 'font-size: 14px; font-weight: bold; color: blue;');
  
  // Try to get book data from the page
  let bookData = null;
  
  // Look for book data in window.__NEXT_DATA__ (Next.js)
  try {
    if (window.__NEXT_DATA__ && window.__NEXT_DATA__.props) {
      const props = window.__NEXT_DATA__.props;
      if (props.pageProps && props.pageProps.book) {
        bookData = props.pageProps.book;
        console.log('%cFound book data in Next.js props', 'color: green;');
      }
    }
  } catch (err) {
    console.log('%cError accessing Next.js data', 'color: red;');
  }
  
  // If not found, try to find it in React DevTools
  if (!bookData) {
    console.log('%cCould not find book data directly, please use React DevTools to inspect component state', 'color: orange;');
    console.log('%cLook for the BookPageClient component and check the "book" state', 'color: orange;');
    return;
  }
  
  // Analyze the book data
  console.log('%cBook Information:', 'font-weight: bold;');
  console.log(`Title: ${bookData.title}`);
  console.log(`ID: ${bookData._id}`);
  
  // Premium status analysis
  console.log('%c\nPremium Status Analysis:', 'font-weight: bold;');
  console.log(`isPremium: ${bookData.isPremium} (${typeof bookData.isPremium})`);
  console.log(`price: ${bookData.price} (${typeof bookData.price})`);
  
  // Logic check
  const shouldBePremium = 
    bookData.isPremium === true || 
    bookData.isPremium === 'true' || 
    String(bookData.isPremium).toLowerCase() === 'true' ||
    (bookData.price && Number(bookData.price) > 0);
    
  console.log(`\nComputed Premium Status: ${shouldBePremium ? 'PREMIUM' : 'NOT PREMIUM'}`);
  
  if (shouldBePremium) {
    if (!bookData.isPremium) {
      console.log('%c⚠️ ISSUE: Book has a price but isPremium is not true!', 'color: red; font-weight: bold;');
    }
    
    if (!bookData.price || Number(bookData.price) <= 0) {
      console.log('%c⚠️ ISSUE: Book is marked as premium but has no price!', 'color: red; font-weight: bold;');
    }
  }
  
  console.log('\nSuggested fix:');
  console.log(JSON.stringify({
    isPremium: shouldBePremium,
    price: shouldBePremium ? (Number(bookData.price) || 25) : 0
  }, null, 2));
  
  console.log('\n%cTo apply this fix, add ?debug=true to the URL and use the "Force Premium Check" button', 'font-style: italic;');
  
  return {
    original: bookData,
    shouldBePremium: shouldBePremium,
    suggestedFix: {
      isPremium: shouldBePremium,
      price: shouldBePremium ? (Number(bookData.price) || 25) : 0
    }
  };
};

console.log('Premium Debug Utility loaded. Type debugPremium() to analyze the current book.');

// Export function for module use
export default window.debugPremium; 